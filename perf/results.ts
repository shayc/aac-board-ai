import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const ROOT_DIR = path.resolve(import.meta.dirname, "..");
export const RESULTS_DIR = path.join(ROOT_DIR, "perf-results");
export const RAW_RESULTS_DIR = path.join(RESULTS_DIR, "raw");
export const PROFILES_DIR = path.join(RESULTS_DIR, "profiles");
export const RESULTS_FILE = path.join(RESULTS_DIR, "results.json");
export const REPORT_FILE = path.join(RESULTS_DIR, "report.html");
export const BASE_BUILD_FILE = path.join(RESULTS_DIR, "base", "build.json");
export const PROFILE_MANIFEST = "profile.json";
export const TRACE_SUFFIX = ".trace.json";

export const IS_PROFILING = process.env.PERF_PROFILE === "1";

/** The two builds a run compares: a git ref and the working tree. */
export type BuildName = "base" | "current";

export const DIST_DIRS: Record<BuildName, string> = {
  base: path.join(RESULTS_DIR, "base", "dist"),
  current: path.join(ROOT_DIR, "dist"),
};

export type MetricKind = "timing" | "cpu" | "frames" | "network" | "memory";
export type MetricUnit = "ms" | "count" | "bytes";

/** One value per round for each build; the same index is the same round. */
export interface MetricSamples extends Record<BuildName, number[]> {
  kind: MetricKind;
  unit: MetricUnit;
  description: string;
}

export interface RunSettings {
  browserVersion: string;
  cpuThrottleRate: number;
  sampleCount: number;
  viewport: string;
}

export interface JourneyResult {
  journey: string;
  settings: RunSettings;
  metrics: Record<string, MetricSamples>;
}

export interface BuildInfo {
  source: string;
  commit: string;
  buildHash: string;
}

export interface RunMeta extends RunSettings {
  builds: Record<BuildName, BuildInfo>;
  date: string;
  os: string;
  cpu: string;
}

export interface RunResults {
  meta: RunMeta;
  journeys: JourneyResult[];
}

export interface HotFunction {
  function: string;
  selfMs: number;
}

export interface ProfileListing {
  journey: string;
  commit: string;
  buildHash: string;
  date: string;
  files: string[];
  hotFunctions: { phase: string; functions: HotFunction[] }[];
}

export async function readJSON<T>(file: string): Promise<T | undefined> {
  if (!existsSync(file)) {
    return undefined;
  }

  return JSON.parse(await readFile(file, "utf8")) as T;
}

export async function writeJSON(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2));
}
