import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, rmSync } from "node:fs";
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
} from "./paths.ts";
import type {
  BuildInfo,
  BuildName,
  JourneyResult,
  RunResults,
} from "./results.ts";

/** Where a build's code comes from: a label for the report and a commit. */
interface BuildSource {
  source: string;
  commit: string;
}

const { values: flags } = parseArgs({
  options: {
    base: { type: "string", default: "main" },
    rounds: { type: "string", default: "10" },
  },
});

// Without a listener, Ctrl-C ends this process while a command is still
// running and skips buildBase's cleanup. A listener only runs once the
// interrupted command has failed and that cleanup, which is synchronous, is
// done.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    process.exit(128 + os.constants.signals[signal]);
  });
}

try {
  await compare(flags.base, flags.rounds);
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

async function compare(baseRef: string, rounds: string): Promise<void> {
  // An even number of rounds lets each build go first equally often.
  if (!/^[1-9]\d*$/.test(rounds) || Number(rounds) % 2 !== 0) {
    throw new Error(`--rounds takes an even number above 0, not ${rounds}.`);
  }

  // Read before building, so the report names what was built even if the
  // repository moves on during the run.
  const builds: Record<BuildName, BuildSource> = {
    base: { source: baseRef, commit: resolveCommit(baseRef) },
    current: readWorkingTreeSource(),
  };
  buildApp(ROOT_DIR, DIST_DIRS.current);
  await buildBase(builds.base.commit);

  await rm(RAW_RESULTS_DIR, { recursive: true, force: true });
  run(
    "npx",
    ["playwright", "test", "--config", "perf/playwright.config.ts"],
    ROOT_DIR,
    { PERF_ROUNDS: rounds },
  );

  const results = await collectResults(builds);
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
    if (built.commit === commit && existsSync(DIST_DIRS.base)) {
      return;
    }
  }

  await rm(BASE_BUILD_FILE, { force: true });
  const sourceDir = await mkdtemp(path.join(os.tmpdir(), "perf-base-"));

  try {
    run("git", ["worktree", "add", "--detach", sourceDir, commit], ROOT_DIR);
    run("npm", ["ci"], sourceDir, { HUSKY: "0" });
    buildApp(sourceDir, DIST_DIRS.base);
  } finally {
    // Neither step may throw: a failure here would hide the one that led here.
    git(["worktree", "remove", "--force", sourceDir]);
    rmSync(sourceDir, { recursive: true, force: true });
  }

  await writeFile(BASE_BUILD_FILE, JSON.stringify({ commit }));
}

async function collectResults(
  builds: Record<BuildName, BuildSource>,
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

  return {
    date: new Date().toISOString(),
    settings: first.settings,
    builds: {
      base: await describeBuild("base", builds.base),
      current: await describeBuild("current", builds.current),
    },
    journeys,
  };
}

function readWorkingTreeSource(): BuildSource {
  const isDirty = git(["status", "--porcelain"]) !== "";

  return {
    source: isDirty ? "working tree with uncommitted changes" : "working tree",
    commit: resolveCommit("HEAD"),
  };
}

async function describeBuild(
  build: BuildName,
  { source, commit }: BuildSource,
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

  console.log(`\nBase:    ${formatBuild(builds.base)}`);
  console.log(`Current: ${formatBuild(builds.current)}`);
  console.log(
    `Chromium ${settings.browserVersion}, CPU ${settings.cpuSlowdown}× slowdown, ${settings.roundCount} rounds`,
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
      `\n${settings.roundCount} rounds are too few to flag a change in ${comparison.timings.length} timings; this run only shows that the journeys work.`,
    );
  }

  console.log(`\nSamples: ${RESULTS_FILE}`);
}

function formatBuild({ source, commit, buildHash }: BuildInfo): string {
  return `${source} (commit ${commit}, build ${buildHash})`;
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
    throw new Error(`${ref} is not a commit in this repository.`);
  }

  return commit;
}

function git(args: string[]): string {
  return spawnSync("git", args, {
    cwd: ROOT_DIR,
    encoding: "utf8",
  }).stdout.trim();
}
