export interface TraceEvent {
  name: string;
  cat?: string;
  ph: string;
  ts: number;
  dur?: number;
  pid: number;
  tid: number;
  id?: string;
  id2?: { local?: string; global?: string };
  args?: {
    name?: string;
    data?: {
      url?: string;
      requestId?: string;
      startTime?: number;
      cpuProfile?: {
        nodes?: CPUProfileNode<RawCallFrame>[];
        samples?: number[];
      };
      timeDeltas?: number[];
    };
  };
}

export interface CallFrame {
  functionName: string;
  url: string;
  scriptId: number | string;
  lineNumber: number;
  columnNumber: number;
}

type RawCallFrame = Partial<CallFrame> & Pick<CallFrame, "scriptId">;

export interface CPUProfileNode<Frame = CallFrame> {
  id: number;
  callFrame: Frame;
  parent?: number;
  children?: number[];
}

export interface CPUProfile<Frame = CallFrame> {
  nodes: CPUProfileNode<Frame>[];
  startTime: number;
  endTime: number;
  samples: number[];
  timeDeltas: number[];
}

export interface Breakdown {
  network: number;
  scripting: number;
  rendering: number;
  idle: number;
}

export interface TraceSummary {
  window: { start: number; end: number };
  breakdown: Breakdown;
}

interface Interval {
  start: number;
  end: number;
}

const RENDERING_EVENTS = new Set([
  "UpdateLayoutTree",
  "RecalculateStyles",
  "Layout",
  "HitTest",
  "PrePaint",
  "Paint",
  "PaintImage",
  "Layerize",
  "UpdateLayer",
  "UpdateLayerTree",
  "Commit",
  "CompositeLayers",
  "ParseAuthorStyleSheet",
  "IntersectionObserverController::computeIntersections",
]);

function findMainThread(
  events: TraceEvent[],
  spanName: string,
): { pid: number; tid: number } {
  const span = events.find(
    (event) =>
      event.cat?.includes("blink.user_timing") && event.name === spanName,
  );
  const mainThreads = events.filter(
    (event) =>
      event.ph === "M" &&
      event.name === "thread_name" &&
      event.args?.name === "CrRendererMain",
  );
  const thread =
    mainThreads.find((candidate) => candidate.pid === span?.pid) ??
    mainThreads[0];
  if (!thread) {
    throw new Error("No renderer main thread in trace");
  }

  return { pid: thread.pid, tid: thread.tid };
}

function findSpanWindow(
  events: TraceEvent[],
  spanName: string,
  pid: number,
): Interval | undefined {
  const marks = events.filter(
    (event) =>
      event.pid === pid &&
      event.name === spanName &&
      event.cat?.includes("blink.user_timing"),
  );
  const begin = marks.find((event) => event.ph === "b");
  const end = marks.find((event) => event.ph === "e");

  return begin && end ? { start: begin.ts, end: end.ts } : undefined;
}

function union(intervals: Interval[]): Interval[] {
  const sorted = intervals
    .filter((interval) => interval.end > interval.start)
    .toSorted((a, b) => a.start - b.start);
  const merged: Interval[] = [];

  for (const interval of sorted) {
    const last = merged.at(-1);
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      merged.push({ ...interval });
    }
  }

  return merged;
}

function clip(interval: Interval, window: Interval): Interval {
  return {
    start: Math.max(interval.start, window.start),
    end: Math.min(interval.end, window.end),
  };
}

function totalLength(intervals: Interval[]): number {
  return intervals.reduce(
    (sum, interval) => sum + Math.max(0, interval.end - interval.start),
    0,
  );
}

function subtract(intervals: Interval[], removed: Interval[]): Interval[] {
  const result: Interval[] = [];

  for (const interval of intervals) {
    let pieces = [interval];
    for (const cut of removed) {
      pieces = pieces.flatMap((piece) => {
        if (cut.end <= piece.start || cut.start >= piece.end) {
          return [piece];
        }
        return [
          { start: piece.start, end: cut.start },
          { start: cut.end, end: piece.end },
        ].filter((part) => part.end > part.start);
      });
    }
    result.push(...pieces);
  }

  return result;
}

function intersect(intervals: Interval[], other: Interval[]): Interval[] {
  return subtract(intervals, subtract(intervals, other));
}

function mainThreadWork(
  events: TraceEvent[],
  window: Interval,
): { busy: Interval[]; rendering: number; scripting: number } {
  const slices = events
    .filter((event) => event.ph === "X" && event.dur !== undefined)
    .map((event) => ({
      name: event.name,
      start: event.ts,
      end: event.ts + (event.dur ?? 0),
    }))
    .filter((slice) => slice.end > window.start && slice.start < window.end)
    .toSorted((a, b) => a.start - b.start || b.end - a.end);

  const stack: { name: string; start: number; end: number; child: number }[] =
    [];
  const topLevel: Interval[] = [];
  let rendering = 0;
  let scripting = 0;

  const close = (until: number) => {
    for (
      let done = stack.at(-1);
      done && done.end <= until;
      done = stack.at(-1)
    ) {
      stack.pop();
      const clipped = clip(done, window);
      const self = Math.max(0, clipped.end - clipped.start - done.child);
      if (RENDERING_EVENTS.has(done.name)) {
        rendering += self;
      } else {
        scripting += self;
      }
      const parent = stack.at(-1);
      if (parent) {
        parent.child += clipped.end - clipped.start;
      }
    }
  };

  for (const slice of slices) {
    close(slice.start);
    if (stack.length === 0) {
      topLevel.push(clip(slice, window));
    }
    stack.push({ ...slice, child: 0 });
  }
  close(Number.POSITIVE_INFINITY);

  return { busy: union(topLevel), rendering, scripting };
}

function networkIntervals(events: TraceEvent[], window: Interval): Interval[] {
  const startById = new Map<string, number>();
  const intervals: Interval[] = [];

  for (const event of events) {
    const requestId = event.args?.data?.requestId;
    if (!requestId) {
      continue;
    }

    if (
      event.name === "ResourceSendRequest" &&
      /^https?:/.test(event.args?.data?.url ?? "")
    ) {
      startById.set(requestId, event.ts);
    } else if (event.name === "ResourceFinish") {
      const start = startById.get(requestId);
      if (start !== undefined) {
        intervals.push(clip({ start, end: event.ts }, window));
      }
    }
  }

  return union(intervals);
}

export function summarizeTrace(
  events: TraceEvent[],
  spanName: string,
): TraceSummary | undefined {
  const { pid, tid } = findMainThread(events, spanName);
  const window = findSpanWindow(events, spanName, pid);
  if (!window) {
    return undefined;
  }

  const mainThread = events.filter(
    (event) => event.pid === pid && event.tid === tid,
  );
  const { busy, rendering, scripting } = mainThreadWork(mainThread, window);
  const waiting = subtract([window], busy);
  const network = totalLength(
    intersect(waiting, networkIntervals(events, window)),
  );
  const span = window.end - window.start;
  const toMs = (microseconds: number) => microseconds / 1000;

  return {
    window,
    breakdown: {
      network: toMs(network),
      scripting: toMs(scripting),
      rendering: toMs(rendering),
      idle: toMs(Math.max(0, span - rendering - scripting - network)),
    },
  };
}

export function normalizeCPUProfile(
  profile: CPUProfile<RawCallFrame>,
): CPUProfile {
  return {
    ...profile,
    nodes: profile.nodes.map((node) => ({
      ...node,
      callFrame: {
        functionName: node.callFrame.functionName ?? "",
        url: node.callFrame.url ?? "",
        scriptId: node.callFrame.scriptId,
        lineNumber: node.callFrame.lineNumber ?? -1,
        columnNumber: node.callFrame.columnNumber ?? -1,
      },
    })),
  };
}

export function extractCPUProfile(
  events: TraceEvent[],
  spanName: string,
): CPUProfile | undefined {
  const { pid, tid } = findMainThread(events, spanName);
  const header = events.find(
    (event) =>
      event.name === "Profile" && event.pid === pid && event.tid === tid,
  );
  if (!header) {
    return undefined;
  }

  const chunks = events.filter(
    (event) =>
      event.name === "ProfileChunk" &&
      event.pid === pid &&
      event.id === header.id,
  );
  const nodes = new Map<number, CPUProfileNode<RawCallFrame>>();
  const samples: number[] = [];
  const timeDeltas: number[] = [];

  for (const chunk of chunks) {
    const data = chunk.args?.data;
    for (const node of data?.cpuProfile?.nodes ?? []) {
      nodes.set(node.id, { ...node, children: [] });
    }
    samples.push(...(data?.cpuProfile?.samples ?? []));
    timeDeltas.push(...(data?.timeDeltas ?? []));
  }

  for (const node of nodes.values()) {
    if (node.parent !== undefined) {
      nodes.get(node.parent)?.children?.push(node.id);
    }
  }

  const startTime = header.args?.data?.startTime ?? header.ts;
  const endTime = timeDeltas.reduce((time, delta) => time + delta, startTime);

  return normalizeCPUProfile({
    nodes: Array.from(nodes.values()),
    startTime,
    endTime,
    samples,
    timeDeltas,
  });
}
