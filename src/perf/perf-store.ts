import type { OperationName, SpanName } from "./perf-names";
import type {
  InteractionRecord,
  LayoutShiftRecord,
  LongAnimationFrameRecord,
  OperationStats,
  PerfSnapshot,
  RenderRecord,
  ResourceRecord,
  SoftNavigationRecord,
  SpanRecord,
  VitalRecord,
} from "./perf-snapshot";

const operations = new Map<OperationName, OperationStats>();
const spans: SpanRecord[] = [];
const renders: RenderRecord[] = [];
const interactions = new Map<number, InteractionRecord>();
const longAnimationFrames: LongAnimationFrameRecord[] = [];
const resources: ResourceRecord[] = [];
const layoutShifts: LayoutShiftRecord[] = [];
const softNavigations: SoftNavigationRecord[] = [];
const vitals = new Map<string, VitalRecord>();
const spanListeners = new Set<(span: SpanRecord) => void>();

let windowStart = 0;
let interactionCount = 0;

export function recordOperation(name: OperationName, duration: number): void {
  const stats = operations.get(name);

  if (!stats) {
    operations.set(name, { name, count: 1, total: duration, max: duration });
    return;
  }

  stats.count += 1;
  stats.total += duration;
  stats.max = Math.max(stats.max, duration);
}

export function recordSpan(span: SpanRecord): void {
  spans.push(span);

  for (const listener of spanListeners) {
    listener(span);
  }
}

export function recordRender(render: RenderRecord): void {
  renders.push(render);
}

export function recordInteractionStart(): void {
  interactionCount += 1;
}

export function recordInteraction(interaction: InteractionRecord): void {
  const existing = interactions.get(interaction.interactionId);

  if (!existing || interaction.duration > existing.duration) {
    interactions.set(interaction.interactionId, interaction);
  }
}

export function recordLongAnimationFrame(
  frame: LongAnimationFrameRecord,
): void {
  longAnimationFrames.push(frame);
}

export function recordResource(resource: ResourceRecord): void {
  resources.push(resource);
}

export function recordLayoutShift(shift: LayoutShiftRecord): void {
  layoutShifts.push(shift);
}

export function recordSoftNavigation(navigation: SoftNavigationRecord): void {
  softNavigations.push(navigation);
}

export function recordVital(vital: VitalRecord): void {
  vitals.set(`${vital.name}:${vital.navigationId}`, vital);
}

export function beginWindow(): number {
  windowStart = performance.now();
  interactionCount = 0;
  operations.clear();

  return windowStart;
}

export function waitForSpan(
  name: SpanName,
  since: number,
): Promise<SpanRecord> {
  const isMatch = (span: SpanRecord) =>
    span.name === name && span.startTime >= since;
  const recorded = spans.find(isMatch);

  if (recorded) {
    return Promise.resolve(recorded);
  }

  const { promise, resolve } = Promise.withResolvers<SpanRecord>();
  const listener = (span: SpanRecord) => {
    if (isMatch(span)) {
      spanListeners.delete(listener);
      resolve(span);
    }
  };
  spanListeners.add(listener);

  return promise;
}

export function takeSnapshot(): PerfSnapshot {
  const isInWindow = (time: number) => time >= windowStart;

  return {
    windowStart,
    interactionCount,
    spans: spans.filter((span) => isInWindow(span.startTime)),
    operations: Array.from(operations.values()),
    renders: renders.filter((render) => isInWindow(render.commitTime)),
    interactions: Array.from(interactions.values()).filter((interaction) =>
      isInWindow(interaction.startTime),
    ),
    longAnimationFrames: longAnimationFrames.filter((frame) =>
      isInWindow(frame.startTime),
    ),
    resources: resources.filter((resource) => isInWindow(resource.startTime)),
    layoutShifts: layoutShifts.filter((shift) => isInWindow(shift.startTime)),
    softNavigations: softNavigations.filter((navigation) =>
      isInWindow(navigation.startTime),
    ),
    vitals: Array.from(vitals.values()),
  };
}
