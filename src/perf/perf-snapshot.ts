import type { ComponentName, OperationName, SpanName } from "./perf-names";

export interface SpanRecord {
  name: SpanName;
  startTime: number;
  commitTime: number;
  endTime: number;
  route?: string;
}

export interface OperationStats {
  name: OperationName;
  count: number;
  total: number;
  max: number;
}

export interface RenderRecord {
  id: ComponentName;
  parent?: ComponentName;
  phase: string;
  actualDuration: number;
  commitTime: number;
}

export interface InteractionRecord {
  interactionId: number;
  type: string;
  target: string;
  startTime: number;
  duration: number;
  inputDelay: number;
  processingDuration: number;
  presentationDelay: number;
}

export interface ScriptRecord {
  invoker: string;
  invokerType: string;
  sourceURL: string;
  sourceFunctionName: string;
  sourceCharPosition: number;
  startTime: number;
  duration: number;
  forcedStyleAndLayoutDuration: number;
}

export interface LongAnimationFrameRecord {
  startTime: number;
  duration: number;
  blockingDuration: number;
  renderStart: number;
  styleAndLayoutStart: number;
  scripts: ScriptRecord[];
}

export interface ResourceRecord {
  url: string;
  initiatorType: string;
  startTime: number;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
}

export interface LayoutShiftRecord {
  startTime: number;
  value: number;
  hadRecentInput: boolean;
}

export interface SoftNavigationRecord {
  route: string;
  navigationId: number;
  startTime: number;
  duration: number;
}

export type VitalName = "TTFB" | "FCP" | "LCP" | "CLS" | "INP";

export interface VitalRecord {
  name: VitalName;
  value: number;
  rating: string;
  navigationType: string;
  navigationId: number;
  navigationStartTime: number;
  route: string;
  attribution: Record<string, string | number | undefined>;
}

export interface PerfSnapshot {
  windowStart: number;
  interactionCount: number;
  spans: SpanRecord[];
  operations: OperationStats[];
  renders: RenderRecord[];
  interactions: InteractionRecord[];
  longAnimationFrames: LongAnimationFrameRecord[];
  resources: ResourceRecord[];
  layoutShifts: LayoutShiftRecord[];
  softNavigations: SoftNavigationRecord[];
  vitals: VitalRecord[];
}

export interface PerfHarness {
  beginWindow: () => number;
  waitForSpan: (name: SpanName, since: number) => Promise<SpanRecord>;
  settle: () => Promise<void>;
  snapshot: () => PerfSnapshot;
}

declare global {
  interface Window {
    __perf?: PerfHarness;
  }
}
