import type { ClientInstrumentation } from "react-router";
import { measureOperation } from "./operations";
import type { OperationName, SpanName } from "./perf-names";
import { ProfiledSubtree, type PerfProfilerProps } from "./profiled-subtree";
import {
  routerInstrumentation,
  startSpan,
  trackInputEvents,
  useSpan,
  type PerfSpan,
} from "./spans";

export type { PerfSpan } from "./spans";

const isPerfEnabled = import.meta.env.VITE_PERF === "true";

const idleSpan: PerfSpan = { start: () => undefined };

function runUnmeasured<T>(_name: OperationName, run: () => T): T {
  return run();
}

function useIdleSpan(_name: SpanName, _result?: unknown): PerfSpan {
  return idleSpan;
}

function UnprofiledSubtree({ children }: PerfProfilerProps) {
  return children;
}

export const measure = isPerfEnabled ? measureOperation : runUnmeasured;

export const usePerfSpan = isPerfEnabled ? useSpan : useIdleSpan;

export const PerfProfiler = isPerfEnabled ? ProfiledSubtree : UnprofiledSubtree;

export const perfRouterInstrumentations: ClientInstrumentation[] = isPerfEnabled
  ? [routerInstrumentation]
  : [];

export function startPerf(): void {
  if (!isPerfEnabled) {
    return;
  }

  startSpan("load:app:board", 0);
  trackInputEvents();
  void import("./collector").then(({ startCollector }) => startCollector());
}
