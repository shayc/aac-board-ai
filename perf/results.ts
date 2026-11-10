import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const ROOT_DIR = path.resolve(import.meta.dirname, "..");
export const DIST_DIR = path.join(ROOT_DIR, "dist");
export const RESULTS_DIR = path.join(ROOT_DIR, "perf-results");
export const RAW_RESULTS_DIR = path.join(RESULTS_DIR, "raw");
export const PROFILES_DIR = path.join(RESULTS_DIR, "profiles");
export const RESULTS_FILE = path.join(RESULTS_DIR, "results.json");
export const BASELINE_FILE = path.join(RESULTS_DIR, "baseline.json");
export const NOISE_FLOOR_FILE = path.join(RESULTS_DIR, "noise-floor.json");
export const REPORT_FILE = path.join(RESULTS_DIR, "report.html");
export const PROFILE_MANIFEST = "profile.json";
export const TRACE_SUFFIX = ".trace.json";

export type MetricKind = "timing" | "cpu" | "frames" | "network" | "memory";
export type MetricUnit = "ms" | "count" | "bytes";

export interface MetricSamples {
  kind: MetricKind;
  unit: MetricUnit;
  description: string;
  values: number[];
}

export interface RunSettings {
  browserVersion: string;
  cpuThrottleRate: number;
  cpuBenchmarkMs: number;
  sampleCount: number;
  viewport: string;
  os: string;
  cpu: string;
}

export type JourneySettings = Omit<RunSettings, "os" | "cpu">;

export interface JourneyResult {
  journey: string;
  settings: JourneySettings;
  metrics: Record<string, MetricSamples>;
}

export interface RunMeta extends RunSettings {
  commit: string;
  isDirty: boolean;
  buildHash: string;
  date: string;
}

export interface RunResults {
  meta: RunMeta;
  journeys: JourneyResult[];
}

export interface NoiseFloor {
  comparisonCount: number;
  latestDate: string;
  percentByMetric: Record<string, number>;
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
