import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";
import { build } from "vite";
import {
  compareRuns,
  measureNoiseFloor,
  type Comparison,
  type Verdict,
} from "./comparison.ts";
import { readHotFunctions } from "./cpu-profile.ts";
import { formatPercent, formatValue, renderReport } from "./report.ts";
import {
  BASELINE_FILE,
  DIST_DIR,
  NOISE_FLOOR_FILE,
  PROFILE_MANIFEST,
  PROFILES_DIR,
  RAW_RESULTS_DIR,
  REPORT_FILE,
  RESULTS_FILE,
  ROOT_DIR,
  TRACE_SUFFIX,
  readJSON,
  writeJSON,
  type JourneyResult,
  type NoiseFloor,
  type ProfileListing,
  type RunMeta,
  type RunResults,
} from "./results.ts";
import { median } from "./stats.ts";

const PLAYWRIGHT_TEST = [
  "playwright",
  "test",
  "--config",
  "perf/playwright.config.ts",
];
const HOT_FUNCTION_COUNT = 10;

const { values: flags } = parseArgs({
  options: {
    "save-baseline": { type: "boolean", default: false },
    profile: { type: "string" },
    samples: { type: "string" },
  },
});

if (flags.samples !== undefined && !isPositiveInteger(flags.samples)) {
  console.error(
    `--samples takes a whole number above 0, not ${flags.samples}.`,
  );
  process.exit(1);
}

await build({ root: ROOT_DIR, build: { sourcemap: "hidden" } });

if (flags.profile === undefined) {
  await measure(flags["save-baseline"], flags.samples);
} else {
  await profile(flags.profile);
}

async function measure(
  shouldSaveBaseline: boolean,
  samples: string | undefined,
): Promise<void> {
  await rm(RAW_RESULTS_DIR, { recursive: true, force: true });
  runOrExit(
    "npx",
    PLAYWRIGHT_TEST,
    samples === undefined ? {} : { PERF_SAMPLES: samples },
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
  const comparison = compareRuns(results, baseline, undefined);
  const differingSettings = comparison.settingDifferences.map(
    ({ setting }) => setting,
  );
  if (differingSettings.length > 0) {
    console.log(
      `Same build as the baseline, but settings differ (${differingSettings.join(", ")}), so the noise floor was not updated. Rerun while the machine is idle, or save a new baseline if a setting changed on purpose.`,
    );
    return;
  }

  const noiseFloor = measureNoiseFloor(
    results,
    comparison,
    await readJSON<NoiseFloor>(NOISE_FLOOR_FILE),
  );
  await writeJSON(NOISE_FLOOR_FILE, noiseFloor);
  console.log(
    `Same build as the baseline: updated the noise floor (${noiseFloor.comparisonCount} same-build comparisons).`,
  );
}

async function profile(journey: string): Promise<void> {
  runOrExit("npx", [...PLAYWRIGHT_TEST, "--grep", ` ${journey}$`], {
    PERF_PROFILE: "1",
  });

  const journeyDir = path.join(PROFILES_DIR, journey);
  const meta = await collectRunMeta();
  const files = (await readdir(journeyDir)).toSorted();
  const hotFunctions = await readPhaseHotFunctions(journeyDir, files);
  await writeJSON(path.join(journeyDir, PROFILE_MANIFEST), {
    journey,
    commit: meta.commit,
    buildHash: meta.buildHash,
    date: meta.date,
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
        HOT_FUNCTION_COUNT,
      ),
    });
  }

  return hotFunctions;
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
      ...(await collectRunMeta()),
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

async function collectRunMeta(): Promise<
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
    .filter((entry) => entry.isFile() && !entry.name.endsWith(".map"))
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
  const summaryMetrics = comparison.metrics.filter(
    ({ kind, verdict }) => kind === "timing" || isFlagged(verdict),
  );

  for (const journey of results.journeys) {
    console.log(`\n${journey.journey}`);

    for (const metric of summaryMetrics.filter(
      (candidate) => candidate.journey === journey.journey,
    )) {
      const change =
        metric.changePercent === undefined
          ? ""
          : ` (${formatPercent(metric.changePercent)}, p=${metric.p?.toPrecision(2)})`;
      const marker = isFlagged(metric.verdict) ? `  ← ${metric.verdict}` : "";
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

function isFlagged(verdict: Verdict): boolean {
  return verdict === "regression" || verdict === "improvement";
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
  env: Record<string, string> = {},
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

function isPositiveInteger(text: string): boolean {
  const value = Number(text);

  return Number.isInteger(value) && value > 0;
}
