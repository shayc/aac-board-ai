import path from "node:path";
import type { BuildName } from "./results.ts";

export const ROOT_DIR = path.resolve(import.meta.dirname, "..");
export const RESULTS_DIR = path.join(ROOT_DIR, "perf-results");
export const RAW_RESULTS_DIR = path.join(RESULTS_DIR, "raw");
export const RESULTS_FILE = path.join(RESULTS_DIR, "results.json");
export const XRAY_FILE = path.join(RESULTS_DIR, "xray.json");
export const BASE_BUILD_FILE = path.join(RESULTS_DIR, "base", "build.json");

export const DIST_DIRS: Record<BuildName, string> = {
  base: path.join(RESULTS_DIR, "base", "dist"),
  current: path.join(ROOT_DIR, "dist"),
};
