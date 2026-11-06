import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  compareRuns,
  isSameMachineSpeed,
  measureNoiseFloor,
  type Comparison,
  type NoiseFloor,
  type RunMeta,
  type RunResults,
} from "./compare.ts";
import {
  PROFILES_DIR,
  RAW_RESULTS_DIR,
  RESULTS_DIR,
  type JourneyResult,
} from "./harness.ts";
import { median } from "./stats.ts";
import {
  formatPercent,
  formatValue,
  renderReport,
  type ProfileListing,
} from "./report.ts";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const RESULTS_FILE = path.join(RESULTS_DIR, "results.json");
const BASELINE_FILE = path.join(RESULTS_DIR, "baseline.json");
const NOISE_FLOOR_FILE = path.join(RESULTS_DIR, "noise-floor.json");
const REPORT_FILE = path.join(RESULTS_DIR, "report.html");
const PROFILE_MANIFEST = "profile.json";

const { values: flags } = parseArgs({
  options: {
    "save-baseline": { type: "boolean", default: false },
    profile: { type: "string" },
  },
});

runOrExit("npm", ["run", "build"], {});

if (flags.profile === undefined) {
  await measure(flags["save-baseline"]);
} else {
  await profile(flags.profile);
}

async function measure(shouldSaveBaseline: boolean): Promise<void> {
  await rm(RAW_RESULTS_DIR, { recursive: true, force: true });
  runOrExit(
    "npx",
    ["playwright", "test", "--config", "perf/playwright.config.ts"],
    {},
  );

  const results = await collectResults();
  await writeJSON(RESULTS_FILE, results);

  const baseline = await readJSON<RunResults>(BASELINE_FILE);
  if (baseline?.meta.buildHash === results.meta.buildHash) {
    await updateNoiseFloor(results, baseline);
  }

  printSummary(results, await writeReport(results));

  if (shouldSaveBaseline) {
    await copyFile(RESULTS_FILE, BASELINE_FILE);
    console.log(`Saved this run as the baseline for later runs.`);
  }

  openReport();
}

async function updateNoiseFloor(
  results: RunResults,
  baseline: RunResults,
): Promise<void> {
  if (!isSameMachineSpeed(baseline.meta, results.meta)) {
    console.log(
      "Same build as the baseline, but the machine ran at a different speed (CPU benchmark), so the noise floor was not updated. Save a new baseline while the machine is idle.",
    );
    return;
  }

  const noiseFloor = measureNoiseFloor(
    results,
    compareRuns(results, baseline, undefined),
    await readJSON<NoiseFloor>(NOISE_FLOOR_FILE),
  );
  await writeJSON(NOISE_FLOOR_FILE, noiseFloor);
  console.log(
    `Same build as the baseline: updated the noise floor (${noiseFloor.comparisonCount} same-build comparisons).`,
  );
}

async function profile(journey: string): Promise<void> {
  runOrExit(
    "npx",
    [
      "playwright",
      "test",
      "--config",
      "perf/playwright.config.ts",
      "--grep",
      ` ${journey}$`,
    ],
    { PERF_PROFILE: "1" },
  );

  const journeyDir = path.join(PROFILES_DIR, journey);
  const meta = await describeRun();
  const files = (await readdir(journeyDir)).toSorted();
  await writeJSON(path.join(journeyDir, PROFILE_MANIFEST), {
    journey,
    commit: meta.commit,
    buildHash: meta.buildHash,
    date: meta.date,
    files,
  } satisfies ProfileListing);

  console.log(`Profile of ${journey}:`);
  for (const file of files) {
    console.log(`  ${path.join(journeyDir, file)}`);
  }

  const results = await readJSON<RunResults>(RESULTS_FILE);
  if (results) {
    await writeReport(results);
    console.log(`Linked from ${REPORT_FILE}`);
  }
}

async function collectResults(): Promise<RunResults> {
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

  const viewport = first.viewport
    ? `${first.viewport.width}×${first.viewport.height}`
    : "default viewport";

  return {
    meta: {
      ...(await describeRun()),
      browserVersion: first.browserVersion,
      cpuThrottleRate: first.cpuThrottleRate,
      cpuBenchmarkMs: median(
        journeys.map(({ cpuBenchmarkMs }) => cpuBenchmarkMs),
      ),
      sampleCount: first.sampleCount,
      viewport,
    },
    journeys,
  };
}

async function describeRun(): Promise<
  Pick<RunMeta, "commit" | "isDirty" | "buildHash" | "date" | "os" | "cpu">
> {
  return {
    commit: git(["rev-parse", "--short", "HEAD"]),
    isDirty: git(["status", "--porcelain"]) !== "",
    buildHash: await hashBuild(),
    date: `${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`,
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0]?.model ?? "unknown CPU",
  };
}

// Vite fingerprints its output, so identical source gives an identical
// hash; this is what "the same build" means for the noise floor.
async function hashBuild(): Promise<string> {
  const entries = await readdir(DIST_DIR, {
    recursive: true,
    withFileTypes: true,
  });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .toSorted();

  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(path.relative(DIST_DIR, file));
    hash.update(await readFile(file));
  }

  return hash.digest("hex").slice(0, 12);
}

async function writeReport(results: RunResults): Promise<Comparison> {
  const baseline = await readJSON<RunResults>(BASELINE_FILE);
  const noiseFloor = await readJSON<NoiseFloor>(NOISE_FLOOR_FILE);
  const comparison = compareRuns(results, baseline, noiseFloor);

  await writeFile(
    REPORT_FILE,
    renderReport({
      results,
      baselineMeta: baseline?.meta,
      noiseFloor,
      comparison,
      profiles: await listProfiles(),
    }),
  );

  return comparison;
}

async function listProfiles(): Promise<ProfileListing[]> {
  const journeys = await readdir(PROFILES_DIR).catch(() => []);
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
  const flagged = comparison.metrics.filter(
    ({ kind, verdict }) =>
      kind === "timing" ||
      verdict === "regression" ||
      verdict === "improvement",
  );

  for (const journey of results.journeys) {
    console.log(`\n${journey.journey}`);

    for (const metric of flagged.filter(
      (candidate) => candidate.journey === journey.journey,
    )) {
      const change =
        metric.changePercent === undefined
          ? ""
          : ` (${formatPercent(metric.changePercent)}, p=${metric.p?.toPrecision(2)})`;
      const isFlagged =
        metric.verdict === "regression" || metric.verdict === "improvement";
      const marker = isFlagged ? `  ← ${metric.verdict}` : "";
      console.log(
        `  ${metric.metric.padEnd(36)} ${formatValue(metric.current.median, metric.unit).padStart(9)}${change}${marker}`,
      );
    }
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

function runOrExit(
  command: string,
  args: string[],
  env: Record<string, string>,
): void {
  const { status } = spawnSync(command, args, {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });

  if (status !== 0) {
    console.error(`\n${command} ${args.join(" ")} failed; no report written.`);
    process.exit(status ?? 1);
  }
}

function git(args: string[]): string {
  return spawnSync("git", args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
  }).stdout.trim();
}

async function readJSON<T>(file: string): Promise<T | undefined> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return undefined;
  }
}

async function writeJSON(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2));
}
