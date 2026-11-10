import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  compareBuilds,
  type Comparison,
  type TimingComparison,
} from "./comparison.ts";
import {
  BASE_BUILD_FILE,
  DIST_DIRS,
  RAW_RESULTS_DIR,
  RESULTS_FILE,
  ROOT_DIR,
  type BuildInfo,
  type BuildName,
  type JourneyResult,
  type RunResults,
} from "./results.ts";

const { values: flags } = parseArgs({
  options: {
    base: { type: "string", default: "main" },
    samples: { type: "string", default: "10" },
  },
});

try {
  await compare(flags.base, flags.samples);
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

async function compare(baseRef: string, samples: string): Promise<void> {
  if (!/^[1-9]\d*$/.test(samples)) {
    throw new Error(`--samples takes a whole number above 0, not ${samples}.`);
  }

  const baseCommit = resolveCommit(baseRef);
  buildApp(ROOT_DIR, DIST_DIRS.current);
  await buildBase(baseCommit);

  await rm(RAW_RESULTS_DIR, { recursive: true, force: true });
  run(
    "npx",
    ["playwright", "test", "--config", "perf/playwright.config.ts"],
    ROOT_DIR,
    { PERF_SAMPLES: samples },
  );

  const results = await collectResults(baseRef, baseCommit);
  await writeFile(RESULTS_FILE, JSON.stringify(results, null, 2));
  printReport(results, compareBuilds(results));
}

// Both builds come from the same command, so they differ only by their source.
function buildApp(sourceDir: string, distDir: string): void {
  run(
    "npx",
    ["vite", "build", "--outDir", distDir, "--emptyOutDir"],
    sourceDir,
  );
}

/**
 * Checks the base commit out into a temporary worktree, installs its own
 * dependencies and builds it. The build is kept until the base commit changes.
 */
async function buildBase(commit: string): Promise<void> {
  if (existsSync(BASE_BUILD_FILE)) {
    const built = JSON.parse(await readFile(BASE_BUILD_FILE, "utf8")) as {
      commit: string;
    };
    if (built.commit === commit) {
      return;
    }
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

  await writeFile(BASE_BUILD_FILE, JSON.stringify({ commit }));
}

async function collectResults(
  baseRef: string,
  baseCommit: string,
): Promise<RunResults> {
  const files = (await readdir(RAW_RESULTS_DIR)).toSorted();
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

  const isDirty = git(["status", "--porcelain"]) !== "";

  return {
    date: new Date().toISOString(),
    settings: first.settings,
    builds: {
      base: await describeBuild("base", baseRef, baseCommit),
      current: await describeBuild(
        "current",
        isDirty ? "working tree with uncommitted changes" : "working tree",
        "HEAD",
      ),
    },
    journeys,
  };
}

async function describeBuild(
  build: BuildName,
  source: string,
  commit: string,
): Promise<BuildInfo> {
  return {
    source,
    commit: git(["rev-parse", "--short", commit]),
    buildHash: await hashBuild(DIST_DIRS[build]),
  };
}

// Vite fingerprints its output, so identical source gives an identical hash.
async function hashBuild(distDir: string): Promise<string> {
  const entries = await readdir(distDir, {
    recursive: true,
    withFileTypes: true,
  });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .toSorted();

  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(path.relative(distDir, file));
    hash.update(await readFile(file));
  }

  return hash.digest("hex").slice(0, 12);
}

function printReport(results: RunResults, comparison: Comparison): void {
  const { builds, settings } = results;
  const describe = ({ source, commit, buildHash }: BuildInfo) =>
    `${source} (commit ${commit}, build ${buildHash})`;

  console.log(`\nBase:    ${describe(builds.base)}`);
  console.log(`Current: ${describe(builds.current)}`);
  console.log(
    `Chromium ${settings.browserVersion}, CPU ${settings.cpuSlowdown}× slowdown, ${settings.sampleCount} rounds`,
  );

  for (const { journey } of results.journeys) {
    console.log(`\n${journey}`);
    for (const timing of comparison.timings) {
      if (timing.journey === journey) {
        console.log(`  ${formatTiming(timing)}`);
      }
    }
  }

  if (builds.base.buildHash === builds.current.buildHash) {
    console.log(
      "\nBoth builds are identical, so any flag is a false positive.",
    );
  }
  if (!comparison.canFlagChanges) {
    console.log(
      `\n${settings.sampleCount} rounds are too few to flag a change in ${comparison.timings.length} timings; this run only shows that the journeys work.`,
    );
  }

  console.log(`\nSamples: ${RESULTS_FILE}`);
}

function formatTiming(timing: TimingComparison): string {
  const { medians, difference, differenceInterval: interval } = timing;
  const range = interval
    ? `${formatSigned(interval.low)} to ${formatSigned(interval.high)}`
    : "no interval";
  const columns = [
    timing.timing.padEnd(28),
    `${formatMs(medians.base)} → ${formatMs(medians.current)} ms`.padEnd(20),
    `${formatSigned(difference)} ms (${formatSigned(timing.differencePercent)}%)`.padEnd(
      22,
    ),
    `[${range}]`.padEnd(20),
    `p=${timing.p.toPrecision(2)}`,
  ];
  const flag = timing.verdict === "unchanged" ? "" : `  ← ${timing.verdict}`;

  return `${columns.join("  ")}${flag}`;
}

function formatMs(value: number): string {
  return Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1);
}

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${formatMs(value)}`;
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
    throw new Error(`${command} ${args.join(" ")} failed.`);
  }
}

function resolveCommit(ref: string): string {
  const commit = git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  if (commit === "") {
    throw new Error(`--base ${ref} is not a commit in this repository.`);
  }

  return commit;
}

function git(args: string[]): string {
  return spawnSync("git", args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
  }).stdout.trim();
}
