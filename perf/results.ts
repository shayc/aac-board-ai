import { join } from "node:path";
import type { PerfSnapshot, SpanRecord } from "../src/perf/perf-snapshot.ts";
import type { TraceSummary } from "./trace.ts";

export const ROOT = join(import.meta.dirname, "..");
export const RESULTS_DIR = join(ROOT, "perf-results");

export interface Settings {
  warmups: number;
  cpuSlowdown: number;
  network: { latencyMs: number; downloadKbps: number; uploadKbps: number };
  viewport: { width: number; height: number };
  locale: string;
  timezone: string;
}

export interface RunMetrics {
  flow: string;
  run: number;
  span: SpanRecord;
  windowStart: number;
  trace?: TraceSummary;
  snapshot: PerfSnapshot;
}

export interface FlowInfo {
  id: string;
  title: string;
  span: string;
  kind: "load" | "interaction";
}

export interface RunMeta {
  date: string;
  commit: string;
  browser: string;
  node: string;
  runs: number;
  settings: Settings;
  flows: FlowInfo[];
}

export interface BundleFile {
  file: string;
  type: "js" | "css";
  bytes: number;
  gzipBytes: number;
  isInitial: boolean;
}

export interface FlowSummaryRecord {
  median: number;
  iqr: number;
}

export interface ResultSummary {
  commit: string;
  date: string;
  flows: Record<string, FlowSummaryRecord>;
}
