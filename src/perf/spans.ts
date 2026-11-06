import type { ClientInstrumentation } from "react-router";
import { useLayoutEffect } from "react";
import type { SpanName } from "./perf-names";
import { recordInteractionStart, recordSpan } from "./perf-store";
import { routeOf } from "./sanitize";

export interface PerfSpan {
  start: () => void;
}

interface PendingSpan {
  startTime: number;
}

const INPUT_EVENT_TYPES = [
  "pointerdown",
  "pointerup",
  "click",
  "keydown",
  "keyup",
] as const;
const INTERACTION_START_TYPES = new Set(["pointerdown", "keydown"]);
const NO_RESULT = Symbol("no result");

const pendingSpans = new Map<SpanName, PendingSpan>();
let taskInputTime: number | undefined;

function trackInput(event: Event): void {
  if (INTERACTION_START_TYPES.has(event.type)) {
    recordInteractionStart();
  }

  if (taskInputTime !== undefined) {
    return;
  }

  taskInputTime = event.timeStamp;
  setTimeout(() => {
    taskInputTime = undefined;
  }, 0);
}

export function trackInputEvents(): void {
  for (const type of INPUT_EVENT_TYPES) {
    window.addEventListener(type, trackInput, { capture: true, passive: true });
  }
}

function inputTimeOrNow(): number {
  return taskInputTime ?? performance.now();
}

function afterNextPaint(callback: (paintTime: number) => void): void {
  requestAnimationFrame(() => {
    setTimeout(() => callback(performance.now()), 0);
  });
}

function endAtNextPaint(name: SpanName, startTime: number): void {
  const commitTime = performance.now();
  const route = routeOf(location.pathname);

  afterNextPaint((endTime) => {
    performance.measure(name, { start: startTime, end: endTime });
    recordSpan({ name, startTime, commitTime, endTime, route });
  });
}

export function startSpan(name: SpanName, startTime = inputTimeOrNow()): void {
  pendingSpans.set(name, { startTime });
}

function endSpan(name: SpanName): void {
  const pending = pendingSpans.get(name);
  if (!pending) {
    return;
  }

  pendingSpans.delete(name);
  endAtNextPaint(name, pending.startTime);
}

export function useSpan(name: SpanName, result: unknown = NO_RESULT): PerfSpan {
  useLayoutEffect(() => {
    if (result !== NO_RESULT) {
      endSpan(name);
    }
  }, [name, result]);

  return { start: () => startSpan(name) };
}

export const routerInstrumentation: ClientInstrumentation = {
  router(router) {
    router.instrument({
      async navigate(navigate) {
        startSpan("route:board:open");
        await navigate();
      },
    });
  },
};
