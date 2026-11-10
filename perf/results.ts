import path from "node:path";

export const ROOT_DIR = path.resolve(import.meta.dirname, "..");
export const RESULTS_DIR = path.join(ROOT_DIR, "perf-results");
export const RAW_RESULTS_DIR = path.join(RESULTS_DIR, "raw");
export const RESULTS_FILE = path.join(RESULTS_DIR, "results.json");
export const BASE_BUILD_FILE = path.join(RESULTS_DIR, "base", "build.json");

/** The two builds a run compares: a git ref and the working tree. */
export type BuildName = "base" | "current";

export const DIST_DIRS: Record<BuildName, string> = {
  base: path.join(RESULTS_DIR, "base", "dist"),
  current: path.join(ROOT_DIR, "dist"),
};

/** Milliseconds per round for each build; the same index is the same round. */
export type TimingSamples = Record<BuildName, number[]>;

export interface RunSettings {
  browserVersion: string;
  cpuSlowdown: number;
  sampleCount: number;
}

export interface JourneyResult {
  journey: string;
  settings: RunSettings;
  timings: Record<string, TimingSamples>;
}

export interface BuildInfo {
  source: string;
  commit: string;
  buildHash: string;
}

export interface RunResults {
  date: string;
  settings: RunSettings;
  builds: Record<BuildName, BuildInfo>;
  journeys: JourneyResult[];
}
