import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { compareBuilds, type Comparison } from "./comparison.ts";
import { readHotFunctions } from "./cpu-profile.ts";
import { formatDifference, formatValue, renderReport } from "./report.ts";
import {
  BASE_BUILD_FILE,
  DIST_DIRS,
  PROFILE_MANIFEST,
  PROFILES_DIR,
  RAW_RESULTS_DIR,
  REPORT_FILE,
  RESULTS_FILE,
  ROOT_DIR,
  TRACE_SUFFIX,
  readJSON,
  writeJSON,
  type BuildInfo,
  type BuildName,
  type JourneyResult,
  type ProfileListing,
  type RunResults,
} from "./results.ts";

const PLAYWRIGHT_TEST = [
  "playwright",
  "test",
  "--config",
  "perf/playwright.config.ts",
];
const HOT_FUNCTION_COUNT = 10;

const { values: flags } = parseArgs({
  options: {
    base: { type: "string", default: "main" },
    profile: { type: "string" },
    samples: { type: "string" },
  },
});

try {
  if (flags.profile === undefined) {
    await compare(flags.base, flags.samples);
  } else {
    await profile(flags.profile);
  }
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

async function compare(
  baseRef: string,
  samples: string | undefined,
): Promise<void> {
  if (samples !== undefined && !isPositiveInteger(samples)) {
    throw new Error(`--samples takes a whole number above 0, not ${samples}.`);
  }

  const baseCommit = resolveCommit(baseRef);
  buildApp(ROOT_DIR, DIST_DIRS.current);
  await buildBase(baseCommit);

  await rm(RAW_RESULTS_DIR, { recursive: true, force: true });
  run(
    "npx",
    PLAYWRIGHT_TEST,
    ROOT_DIR,
    samples === undefined ? {} : { PERF_SAMPLES: samples },
  );

  const results = await collectResults(baseRef, baseCommit);
  await writeJSON(RESULTS_FILE, results);

  const comparison = await writeReport(results);
  printSummary(results, comparison);
  openReport();
}

async function profile(journey: string): Promise<void> {
  buildApp(ROOT_DIR, DIST_DIRS.current);
  run("npx", [...PLAYWRIGHT_TEST, "--grep", ` ${journey}$`], ROOT_DIR, {
    PERF_PROFILE: "1",
  });

  const journeyDir = path.join(PROFILES_DIR, journey);
  const { commit, buildHash } = await describeCurrentBuild();
  const files = (await readdir(journeyDir)).toSorted();
  const hotFunctions = await readPhaseHotFunctions(journeyDir, files);
  await writeJSON(path.join(journeyDir, PROFILE_MANIFEST), {
    journey,
    commit,
    buildHash,
    date: currentDate(),
    files,
    hotFunctions,
  } satisfies ProfileListing);

  console.log(`Profile of ${journey}:`);
  for (const file of files) {
    console.log(`  ${path.join(journeyDir, file)}`);
  }

  for (const { phase, functions } of hotFunctions) {
    console.log(`\n${phase}: main-thread JavaScript by self time`);
    for (const { function: name, selfMs } of functions.slice(0, 5)) {
      console.log(`  ${formatValue(selfMs, "ms").padStart(9)}  ${name}`);
    }
  }

  const results = await readJSON<RunResults>(RESULTS_FILE);
  if (results) {
    await writeReport(results);
    console.log(`Linked from ${REPORT_FILE}`);
  }
}

// Both builds come from the same command, so they differ only by their source.
function buildApp(sourceDir: string, distDir: string): void {
  run(
    "npx",
    [
      "vite",
      "build",
      "--sourcemap",
      "hidden",
      "--outDir",
      distDir,
      "--emptyOutDir",
    ],
    sourceDir,
  );
}

/**
 * Checks the base commit out into a temporary worktree, installs its own
 * dependencies and builds it. The build is kept until the base commit changes.
 */
async function buildBase(commit: string): Promise<void> {
  const built = await readJSON<{ commit: string }>(BASE_BUILD_FILE);
  if (built?.commit === commit) {
    console.log(`Reusing the build of ${shortCommit(commit)}.`);
    return;
  }

  await rm(BASE_BUILD_FILE, { force: true });
  const sourceDir = await mkdtemp(path.join(os.tmpdir(), "perf-base-"));
  run("git", ["worktree", "add", "--detach", sourceDir, commit], ROOT_DIR);

  try {
    run("npm", ["ci"], sourceDir, { HUSKY: "0" });
    buildApp(sourceDir, DIST_DIRS.base);
  } finally {
    run("git", ["worktree", "remove", "--force", sourceDir], ROOT_DIR);
  }

  await writeJSON(BASE_BUILD_FILE, { commit });
}

async function readPhaseHotFunctions(
  journeyDir: string,
  files: string[],
): Promise<ProfileListing["hotFunctions"]> {
  const hotFunctions: ProfileListing["hotFunctions"] = [];
  for (const file of files.filter((name) => name.endsWith(TRACE_SUFFIX))) {
    hotFunctions.push({
      phase: file.slice(0, -TRACE_SUFFIX.length),
      functions: await readHotFunctions(
        path.join(journeyDir, file),
        DIST_DIRS.current,
        HOT_FUNCTION_COUNT,
      ),
    });
  }

  return hotFunctions;
}

async function collectResults(
  baseRef: string,
  baseCommit: string,
): Promise<RunResults> {
  const files = (await readdir(RAW_RESULTS_DIR)).filter((file) =>
    file.endsWith(".json"),
  );
  const journeys = await Promise.all(
    files.map(
      async (file) =>
        JSON.parse(
          await readFile(path.join(RAW_RESULTS_DIR, file), "utf8"),
        ) as JourneyResult,
    ),
  );
  const [first] = journeys;
  if (!first) {
    throw new Error("The journeys wrote no results.");
  }

  return {
    meta: {
      ...first.settings,
      builds: {
        base: {
          source: baseRef,
          commit: shortCommit(baseCommit),
          buildHash: await hashBuild("base"),
        },
        current: await describeCurrentBuild(),
      },
      date: currentDate(),
      os: `${os.type()} ${os.release()} ${os.arch()}`,
      cpu: os.cpus()[0]?.model ?? "unknown CPU",
    },
    journeys,
  };
}

async function describeCurrentBuild(): Promise<BuildInfo> {
  const isDirty = git(["status", "--porcelain"]) !== "";

  return {
    source: isDirty ? "working tree with uncommitted changes" : "working tree",
    commit: shortCommit("HEAD"),
    buildHash: await hashBuild("current"),
  };
}

// Vite fingerprints its output, so identical source gives an identical hash.
// Source maps are left out: they change with comments even when the code does
// not.
async function hashBuild(build: BuildName): Promise<string> {
  const distDir = DIST_DIRS[build];
  const entries = await readdir(distDir, {
    recursive: true,
    withFileTypes: true,
  });
  const files = entries
    .filter((entry) => entry.isFile() && !entry.name.endsWith(".map"))
    .map((entry) => path.join(entry.parentPath, entry.name))
    .toSorted();

  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(path.relative(distDir, file));
    hash.update(await readFile(file));
  }

  return hash.digest("hex").slice(0, 12);
}

async function writeReport(results: RunResults): Promise<Comparison> {
  const comparison = compareBuilds(results);

  await writeFile(
    REPORT_FILE,
    renderReport({ results, comparison, profiles: await listProfiles() }),
  );

  return comparison;
}

async function listProfiles(): Promise<ProfileListing[]> {
  if (!existsSync(PROFILES_DIR)) {
    return [];
  }

  const journeys = await readdir(PROFILES_DIR);
  const listings = await Promise.all(
    journeys.map((journey) =>
      readJSON<ProfileListing>(
        path.join(PROFILES_DIR, journey, PROFILE_MANIFEST),
      ),
    ),
  );

  return listings.filter((listing) => listing !== undefined);
}

function printSummary(results: RunResults, comparison: Comparison): void {
  const timings = comparison.metrics.filter(({ test }) => test !== undefined);

  for (const { journey } of results.journeys) {
    console.log(`\n${journey}`);

    for (const metric of timings.filter(
      (candidate) => candidate.journey === journey,
    )) {
      const verdict = metric.test?.verdict;
      const marker = verdict === "unchanged" ? "" : `  ← ${verdict}`;
      console.log(
        `  ${metric.metric.padEnd(36)} ${formatValue(metric.spreads.current.median, metric.unit).padStart(9)}  ${formatDifference(metric)}${marker}`,
      );
    }
  }

  if (!comparison.canFlagChanges) {
    console.log(
      `\n${results.meta.sampleCount} samples are too few to flag a change in ${timings.length} timings; this run only shows that the journeys work.`,
    );
  }

  for (const growth of comparison.memory.filter(({ isGrowing }) => isGrowing)) {
    console.log(
      `\nMemory: ${growth.journey} ${growth.metric} median +${formatValue(growth.medianGrowth, growth.unit)}, grew in ${growth.grewCount} of ${growth.sampleCount} samples.`,
    );
  }

  console.log(`\nReport: ${REPORT_FILE}`);
}

function openReport(): void {
  const openers: Partial<Record<NodeJS.Platform, string>> = {
    darwin: "open",
    linux: "xdg-open",
  };
  const opener = openers[process.platform];
  if (!opener || !process.stdout.isTTY) {
    return;
  }

  spawn(opener, [REPORT_FILE], { detached: true, stdio: "ignore" }).unref();
}

function run(
  command: string,
  args: string[],
  cwd: string,
  env: Record<string, string> = {},
): void {
  const { status } = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });

  if (status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed; no report written.`);
  }
}

function resolveCommit(ref: string): string {
  const commit = git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  if (commit === "") {
    throw new Error(`--base ${ref} is not a commit in this repository.`);
  }

  return commit;
}

function shortCommit(ref: string): string {
  return git(["rev-parse", "--short", ref]);
}

function git(args: string[]): string {
  return spawnSync("git", args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
  }).stdout.trim();
}

function currentDate(): string {
  return `${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

function isPositiveInteger(text: string): boolean {
  const value = Number(text);

  return Number.isInteger(value) && value > 0;
}
