import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, rmSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs, promisify } from "node:util";
import { gzip } from "node:zlib";
import { BUDGETS } from "./budgets.ts";
import { compareBuilds } from "./comparison.ts";
import {
  BASE_BUILD_FILE,
  DIST_DIRS,
  RAW_RESULTS_DIR,
  RESULTS_FILE,
  ROOT_DIR,
  XRAY_FILE,
} from "./paths.ts";
import { printComparison, printScorecard } from "./report.ts";
import type {
  BuildInfo,
  BuildName,
  JourneyResult,
  RunResults,
  XrayResults,
} from "./results.ts";
import { scoreMeasurements } from "./scorecard.ts";
import { parseRoundCount } from "./settings.ts";

const BYTES_PER_KILOBYTE = 1000;

interface BuildSource {
  source: string;
  commit: string;
}

const { values: flags } = parseArgs({
  options: {
    base: { type: "string" },
    rounds: { type: "string" },
  },
});

// Defer exit until spawnSync returns and buildBase's synchronous cleanup finishes.
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    process.exit(128 + os.constants.signals[signal]);
  });
}

try {
  if (flags.base === undefined) {
    await takeXray(flags.rounds);
  } else {
    await compare(flags.base, flags.rounds);
  }
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

async function takeXray(rounds: string | undefined): Promise<void> {
  const roundCount = parseRoundCount(rounds, false);
  const source = readWorkingTreeSource();

  console.log("Building the working tree…");
  buildApp(ROOT_DIR, DIST_DIRS.current);
  const journeys = await runJourneys(roundCount, false);

  const [first] = journeys;
  const xray: XrayResults = {
    date: new Date().toISOString(),
    settings: first.settings,
    build: await describeBuild("current", source),
    ...scoreMeasurements(
      {
        ...currentSamples(journeys),
        jsShipped: [await measureJSShipped(DIST_DIRS.current)],
      },
      BUDGETS,
    ),
  };
  await writeFile(XRAY_FILE, JSON.stringify(xray, null, 2));
  printScorecard(xray);
}

async function compare(
  baseRef: string,
  rounds: string | undefined,
): Promise<void> {
  const roundCount = parseRoundCount(rounds, true);

  // Capture source identities before the repository can change during the builds.
  const builds: Record<BuildName, BuildSource> = {
    base: { source: baseRef, commit: resolveCommit(baseRef) },
    current: readWorkingTreeSource(),
  };
  console.log("Building the working tree…");
  buildApp(ROOT_DIR, DIST_DIRS.current);
  await buildBase(builds.base);
  const journeys = await runJourneys(roundCount, true);

  const [first] = journeys;
  const results: RunResults = {
    date: new Date().toISOString(),
    settings: first.settings,
    builds: {
      base: await describeBuild("base", builds.base),
      current: await describeBuild("current", builds.current),
    },
    journeys,
  };
  await writeFile(RESULTS_FILE, JSON.stringify(results, null, 2));
  printComparison(results, compareBuilds(results));
}

function buildApp(sourceDir: string, distDir: string): void {
  run(
    "npx",
    ["vite", "build", "--outDir", distDir, "--emptyOutDir"],
    sourceDir,
  );
}

async function buildBase({ source, commit }: BuildSource): Promise<void> {
  if (existsSync(BASE_BUILD_FILE)) {
    const built = JSON.parse(await readFile(BASE_BUILD_FILE, "utf8")) as {
      commit: string;
    };
    if (built.commit === commit && existsSync(DIST_DIRS.base)) {
      return;
    }
  }

  console.log(`Building ${source}, which takes a few minutes…`);
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

async function runJourneys(
  roundCount: number,
  isComparison: boolean,
): Promise<[JourneyResult, ...JourneyResult[]]> {
  console.log(`Running the journeys (rounds: ${roundCount})…`);
  await rm(RAW_RESULTS_DIR, { recursive: true, force: true });
  run(
    "npx",
    ["playwright", "test", "--config", "perf/playwright.config.ts"],
    ROOT_DIR,
    {
      PERF_ROUNDS: String(roundCount),
      PERF_COMPARISON: isComparison ? "1" : "",
    },
  );

  const files = (await readdir(RAW_RESULTS_DIR)).toSorted();
  const [first, ...others] = await Promise.all(
    files.map(
      async (file) =>
        JSON.parse(
          await readFile(path.join(RAW_RESULTS_DIR, file), "utf8"),
        ) as JourneyResult,
    ),
  );
  if (!first) {
    throw new Error("The journeys wrote no results.");
  }

  return [first, ...others];
}

function currentSamples(journeys: JourneyResult[]): Record<string, number[]> {
  return Object.fromEntries(
    journeys.flatMap(({ timings }) =>
      Object.entries(timings).map(([name, samples]) => [name, samples.current]),
    ),
  );
}

/** Every script the build ships, compressed as a static host would serve it. */
async function measureJSShipped(distDir: string): Promise<number> {
  const scripts = (await listFiles(distDir)).filter((file) =>
    file.endsWith(".js"),
  );
  const compressed = await Promise.all(
    scripts.map(async (file) => promisify(gzip)(await readFile(file))),
  );
  const bytes = compressed.reduce((total, script) => total + script.length, 0);

  return bytes / BYTES_PER_KILOBYTE;
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

async function hashBuild(distDir: string): Promise<string> {
  const files = await listFiles(distDir);

  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(path.relative(distDir, file));
    hash.update(await readFile(file));
  }

  return hash.digest("hex").slice(0, 12);
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .toSorted();
}

/** Stays quiet unless the command fails, so the report is the whole output. */
function run(
  command: string,
  args: string[],
  cwd: string,
  env: Record<string, string> = {},
): void {
  const { status, stdout, stderr } = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    maxBuffer: Infinity,
    env: { ...process.env, ...env },
  });

  if (status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed.\n\n${stdout}${stderr}`.trimEnd(),
    );
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
