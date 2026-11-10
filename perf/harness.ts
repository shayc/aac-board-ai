import {
  test,
  type Browser,
  type BrowserContext,
  type CDPSession,
  type FileChooser,
  type Locator,
  type Page,
  type Request,
} from "@playwright/test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { installPagePerf, type LongFrame } from "./page-perf.ts";
import { ACTION_TIMEOUT_MS, BASE_BUILD_URL } from "./playwright.config.ts";
import {
  IS_PROFILING,
  PROFILES_DIR,
  RAW_RESULTS_DIR,
  TRACE_SUFFIX,
  writeJSON,
  type BuildName,
  type JourneyResult,
  type MetricKind,
  type MetricSamples,
  type MetricUnit,
} from "./results.ts";
import { median } from "./stats.ts";

const SAMPLE_COUNT = Number(process.env.PERF_SAMPLES ?? 10);
const CPU_THROTTLE_RATE = 4;
const MAX_FRAMES_TO_WAIT_FOR_PAINT_ENTRIES = 120;
const TAP_RESULT = "tap-result";

export interface Tap {
  start: number;
  visibleAt: number;
}

export interface TimingMetric {
  name: string;
  description: string;
}

export interface Interval extends TimingMetric {
  start: number;
  end: number;
}

interface Paints {
  fcp: number;
  lcp: number | undefined;
}

interface Memory {
  heap: number;
  nodes: number;
  listeners: number;
}

interface Usage {
  cdpMetrics: Record<string, number>;
  timeOrigin: number;
  now: number;
  transferred: number;
}

/** Reads one page through its own APIs and the Chrome DevTools Protocol. */
export class PageProbe {
  readonly page: Page;
  readonly #cdp: CDPSession;

  constructor(page: Page, cdp: CDPSession) {
    this.page = page;
    this.#cdp = cdp;
  }

  /**
   * Clicks `target` and waits for the first rendered frame in which `result`
   * is visible. The tap starts at its pointerdown, so it covers everything the
   * page does from the press to that frame.
   */
  async tap(target: Locator, result: string): Promise<Tap> {
    await this.watch(TAP_RESULT, result);
    await target.click();

    return this.page.evaluate(
      async ([name, timeout]) => ({
        start: window.__perf.lastPointerDown,
        visibleAt: await window.__perf.visibleAt(name, timeout),
      }),
      [TAP_RESULT, ACTION_TIMEOUT_MS] as const,
    );
  }

  async setCPUSlowdown(rate: number): Promise<void> {
    await this.#cdp.send("Emulation.setCPUThrottlingRate", { rate });
  }

  async watch(name: string, selector: string): Promise<void> {
    await this.page.evaluate(
      ([watchName, watchSelector]) => {
        window.__perf.watch(watchName, watchSelector);
      },
      [name, selector] as const,
    );
  }

  visibleAt(name: string): Promise<number> {
    return this.page.evaluate(
      ([watchName, timeout]) => window.__perf.visibleAt(watchName, timeout),
      [name, ACTION_TIMEOUT_MS] as const,
    );
  }

  /**
   * Board import uses a detached file input, which no document listener can
   * see, so the change listener goes on the chooser's own element.
   */
  async chooseFiles(chooser: FileChooser, file: string): Promise<number> {
    const change = await chooser.element().evaluateHandle((input) => ({
      changedAt: new Promise<number>((resolve) => {
        input.addEventListener("change", () => resolve(performance.now()), {
          once: true,
        });
      }),
    }));
    await chooser.setFiles(file);

    return change.evaluate(({ changedAt }) => changedAt);
  }

  /**
   * Paint entries reach the page a few frames after the paint itself. The
   * browser stops reporting LCP at the first input, so a page that was tapped
   * has FCP only.
   */
  readPaints(): Promise<Paints> {
    return this.page.evaluate(async (maxFrames) => {
      const perf = window.__perf;
      const hasLargestPaint = Number.isNaN(perf.lastPointerDown);
      const firstPaint = () =>
        performance.getEntriesByName("first-contentful-paint")[0]?.startTime ??
        Number.NaN;
      const isReported = () =>
        !Number.isNaN(firstPaint()) &&
        (!hasLargestPaint || !Number.isNaN(perf.largestPaint));

      for (let frame = 0; frame < maxFrames && !isReported(); frame += 1) {
        await new Promise(requestAnimationFrame);
      }

      return {
        fcp: firstPaint(),
        lcp: hasLargestPaint ? perf.largestPaint : undefined,
      };
    }, MAX_FRAMES_TO_WAIT_FOR_PAINT_ENTRIES);
  }

  async readMemory(): Promise<Memory> {
    await this.#cdp.send("HeapProfiler.collectGarbage");
    const metrics = await this.#readCDPMetrics();

    return {
      heap: metrics.JSHeapUsedSize ?? Number.NaN,
      nodes: metrics.Nodes ?? Number.NaN,
      listeners: metrics.JSEventListeners ?? Number.NaN,
    };
  }

  // Service worker fetches have their own timeline, so `transferred` covers
  // what the page itself downloaded.
  async readUsage(): Promise<Usage> {
    const cdpMetrics = await this.#readCDPMetrics();
    const page = await this.page.evaluate(() => ({
      timeOrigin: performance.timeOrigin,
      now: performance.now(),
      transferred: [
        ...performance.getEntriesByType("navigation"),
        ...performance.getEntriesByType("resource"),
      ].reduce(
        (total, entry) =>
          total + (entry as PerformanceResourceTiming).transferSize,
        0,
      ),
    }));

    return { cdpMetrics, ...page };
  }

  async readLongFrames(since: number): Promise<LongFrame[]> {
    const frames = await this.page.evaluate(() => window.__perf.longFrames);

    return frames.filter((frame) => frame.start >= since);
  }

  async markInterval({ name, start, end }: Interval): Promise<void> {
    await this.page.evaluate(
      ([label, from, to]) =>
        performance.measure(label, { start: from, end: to }),
      [name, start, end] as const,
    );
  }

  /** Traces `steps` and snapshots the heap before and after them. */
  async trace(filePrefix: string, steps: () => Promise<void>): Promise<void> {
    const browser = this.page.context().browser();
    if (!browser) {
      throw new Error("Profiling needs a launched browser.");
    }

    await this.#writeHeapSnapshot(`${filePrefix}.before.heapsnapshot`);
    await browser.startTracing(this.page, {
      path: `${filePrefix}${TRACE_SUFFIX}`,
      screenshots: true,
    });

    await steps();

    await browser.stopTracing();
    await this.#writeHeapSnapshot(`${filePrefix}.after.heapsnapshot`);
  }

  async #writeHeapSnapshot(file: string): Promise<void> {
    const chunks: string[] = [];
    const collect = ({ chunk }: { chunk: string }) => {
      chunks.push(chunk);
    };

    this.#cdp.on("HeapProfiler.addHeapSnapshotChunk", collect);
    await this.#cdp.send("HeapProfiler.takeHeapSnapshot");
    this.#cdp.off("HeapProfiler.addHeapSnapshotChunk", collect);

    await writeFile(file, chunks.join(""));
  }

  async #readCDPMetrics(): Promise<Record<string, number>> {
    const { metrics } = await this.#cdp.send("Performance.getMetrics");

    return Object.fromEntries(metrics.map(({ name, value }) => [name, value]));
  }
}

// Board symbols load from blob: URLs, which never touch the network.
class RequestCounter {
  requests = 0;
  failed = 0;

  constructor(context: BrowserContext) {
    context.on("request", (request) => {
      if (isNetworkRequest(request)) {
        this.requests += 1;
      }
    });
    context.on("requestfailed", (request) => {
      if (isNetworkRequest(request)) {
        this.failed += 1;
      }
    });
  }
}

function isNetworkRequest(request: Request): boolean {
  return /^https?:/.test(request.url());
}

interface MetricDefinition {
  unit: MetricUnit;
  description: string;
}

interface RecordedMetric extends MetricDefinition {
  kind: MetricKind;
  values: number[];
}

const CPU_METRICS = {
  "cpu.task": {
    unit: "ms",
    description: "All main-thread task time (CDP TaskDuration).",
  },
  "cpu.script": {
    unit: "ms",
    description: "JavaScript execution (CDP ScriptDuration).",
  },
  "cpu.layout": { unit: "ms", description: "Layout (CDP LayoutDuration)." },
  "cpu.style": {
    unit: "ms",
    description: "Style recalculation (CDP RecalcStyleDuration).",
  },
} satisfies Record<string, MetricDefinition>;

const FRAME_METRICS = {
  longFrames: {
    unit: "count",
    description: "Animation frames longer than 50 ms.",
  },
  blocking: {
    unit: "ms",
    description: "Summed blocking duration of those frames.",
  },
} satisfies Record<string, MetricDefinition>;

const NETWORK_METRICS = {
  requests: {
    unit: "count",
    description: "HTTP requests from the page and its service worker.",
  },
  failedRequests: {
    unit: "count",
    description:
      "Failed requests, including blocked requests to hosts other than 127.0.0.1.",
  },
  bytes: {
    unit: "bytes",
    description:
      "Bytes the page downloaded (Resource Timing; excludes service worker precaching).",
  },
} satisfies Record<string, MetricDefinition>;

const MEMORY_METRICS = {
  heapGrowth: {
    unit: "bytes",
    description:
      "JS heap used at the end of the loop minus the start. Includes compiled code, which grows while the JIT warms up.",
  },
  nodeGrowth: {
    unit: "count",
    description: "DOM nodes at the end of the loop minus the start.",
  },
  listenerGrowth: {
    unit: "count",
    description: "JS event listeners at the end of the loop minus the start.",
  },
} satisfies Record<string, MetricDefinition>;

/** One run of a journey in a fresh browser context, and what it recorded. */
export class JourneySample {
  readonly journey: string;
  readonly metrics = new Map<string, RecordedMetric>();
  readonly #context: BrowserContext;
  readonly #requests: RequestCounter;
  #tracedProbe: PageProbe | undefined;

  constructor(journey: string, context: BrowserContext) {
    this.journey = journey;
    this.#context = context;
    this.#requests = new RequestCounter(context);
  }

  async openPage(watches: Record<string, string> = {}): Promise<PageProbe> {
    const page = await this.#context.newPage();
    await page.addInitScript(installPagePerf, { watches });

    const cdp = await this.#context.newCDPSession(page);
    await cdp.send("Performance.enable");

    return new PageProbe(page, cdp);
  }

  /**
   * Wraps one measured stretch of a journey and slows the CPU for it; the
   * steps around it run at full speed. Timing runs record CPU, long animation
   * frame and network deltas for the stretch; profile runs trace it instead.
   */
  async measure(
    probe: PageProbe,
    phase: string,
    steps: () => Promise<void>,
  ): Promise<void> {
    await probe.setCPUSlowdown(CPU_THROTTLE_RATE);
    try {
      await (IS_PROFILING
        ? this.#trace(probe, phase, steps)
        : this.#recordUsage(probe, phase, steps));
    } finally {
      await probe.setCPUSlowdown(1);
    }
  }

  async #recordUsage(
    probe: PageProbe,
    phase: string,
    steps: () => Promise<void>,
  ): Promise<void> {
    const before = await this.#readUsage(probe);
    await steps();
    const after = await this.#readUsage(probe);

    const isSameDocument = before.timeOrigin === after.timeOrigin;
    const frames = await probe.readLongFrames(isSameDocument ? before.now : 0);
    const cpuMs = (metric: string) =>
      ((after.cdpMetrics[metric] ?? 0) - (before.cdpMetrics[metric] ?? 0)) *
      1000;

    this.#record(phase, "cpu", CPU_METRICS, {
      "cpu.task": cpuMs("TaskDuration"),
      "cpu.script": cpuMs("ScriptDuration"),
      "cpu.layout": cpuMs("LayoutDuration"),
      "cpu.style": cpuMs("RecalcStyleDuration"),
    });
    this.#record(phase, "frames", FRAME_METRICS, {
      longFrames: frames.length,
      blocking: frames.reduce(
        (total, frame) => total + frame.blockingDuration,
        0,
      ),
    });
    this.#record(phase, "network", NETWORK_METRICS, {
      requests: after.requests - before.requests,
      failedRequests: after.failed - before.failed,
      bytes: after.transferred - (isSameDocument ? before.transferred : 0),
    });
  }

  async recordInterval(interval: Interval): Promise<void> {
    const { name, description, start, end } = interval;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      throw new Error(`Could not measure ${name}: from ${start} to ${end}.`);
    }

    this.#push(name, { kind: "timing", unit: "ms", description }, end - start);
    await this.#tracedProbe?.markInterval(interval);
  }

  async recordPaints(probe: PageProbe, phase: string): Promise<void> {
    const { fcp, lcp } = await probe.readPaints();

    await this.recordInterval({
      name: `${phase}.fcp`,
      description: "First Contentful Paint.",
      start: 0,
      end: fcp,
    });
    if (lcp !== undefined) {
      await this.recordInterval({
        name: `${phase}.lcp`,
        description:
          "Largest Contentful Paint. Recorded only for phases without a tap, because the browser stops reporting it at the first input.",
        start: 0,
        end: lcp,
      });
    }
  }

  recordMemoryGrowth(phase: string, start: Memory, end: Memory): void {
    this.#record(phase, "memory", MEMORY_METRICS, {
      heapGrowth: end.heap - start.heap,
      nodeGrowth: end.nodes - start.nodes,
      listenerGrowth: end.listeners - start.listeners,
    });
  }

  async #readUsage(probe: PageProbe) {
    const { requests, failed } = this.#requests;

    return { ...(await probe.readUsage()), requests, failed };
  }

  // Intervals recorded during the trace are marked in it, so they show up in
  // the trace's Timings track.
  async #trace(
    probe: PageProbe,
    phase: string,
    steps: () => Promise<void>,
  ): Promise<void> {
    this.#tracedProbe = probe;
    try {
      await probe.trace(path.join(PROFILES_DIR, this.journey, phase), steps);
    } finally {
      this.#tracedProbe = undefined;
    }
  }

  #record<Name extends string>(
    phase: string,
    kind: MetricKind,
    definitions: Record<Name, MetricDefinition>,
    measured: Record<NoInfer<Name>, number>,
  ): void {
    for (const name of Object.keys(definitions) as Name[]) {
      this.#push(
        `${phase}.${name}`,
        { kind, ...definitions[name] },
        measured[name],
      );
    }
  }

  #push(
    name: string,
    definition: Omit<RecordedMetric, "values">,
    value: number,
  ): void {
    const metric = this.metrics.get(name) ?? { ...definition, values: [] };
    metric.values.push(value);
    this.metrics.set(name, metric);
  }
}

const BUILD_NAMES: BuildName[] = ["base", "current"];

/**
 * Measures a journey on both builds in SAMPLE_COUNT rounds. A round runs the
 * journey once per build, back to back, so whatever the machine is doing at
 * that moment slows both alike. Each sample gets a fresh browser context, and
 * one warm-up sample per build is discarded. A profile run traces a single
 * sample of the working tree's build instead.
 */
export async function measureJourney(
  browser: Browser,
  journey: string,
  runJourney: (sample: JourneySample) => Promise<void>,
): Promise<void> {
  if (IS_PROFILING) {
    await rm(path.join(PROFILES_DIR, journey), {
      recursive: true,
      force: true,
    });
    await mkdir(path.join(PROFILES_DIR, journey), { recursive: true });
    await runSample(browser, journey, "current", runJourney);
    return;
  }

  for (const build of BUILD_NAMES) {
    await runSample(browser, journey, build, runJourney);
  }

  const samples: Record<BuildName, JourneySample[]> = { base: [], current: [] };
  for (let round = 0; round < SAMPLE_COUNT; round += 1) {
    for (const build of buildOrder(round)) {
      samples[build].push(await runSample(browser, journey, build, runJourney));
    }
  }

  await writeJourneyResult(browser, journey, samples);
}

// Whichever build runs second in a round finds caches warmer, so the builds
// take turns going first.
function buildOrder(round: number): BuildName[] {
  return round % 2 === 0 ? BUILD_NAMES : BUILD_NAMES.toReversed();
}

async function runSample(
  browser: Browser,
  journey: string,
  build: BuildName,
  runJourney: (sample: JourneySample) => Promise<void>,
): Promise<JourneySample> {
  // The working tree's build is served at the configured baseURL.
  const context = await browser.newContext(
    build === "base" ? { baseURL: BASE_BUILD_URL } : {},
  );

  try {
    const sample = new JourneySample(journey, context);
    await runJourney(sample);
    return sample;
  } finally {
    await context.close();
  }
}

async function writeJourneyResult(
  browser: Browser,
  journey: string,
  samples: Record<BuildName, JourneySample[]>,
): Promise<void> {
  // A metric recorded several times in one sample (one per tap) contributes
  // its median, so every sample weighs the same in the comparison.
  const metrics: Record<string, MetricSamples> = {};
  for (const build of BUILD_NAMES) {
    for (const sample of samples[build]) {
      for (const [name, { values, ...definition }] of sample.metrics) {
        metrics[name] ??= { ...definition, base: [], current: [] };
        metrics[name][build].push(median(values));
      }
    }
  }

  const { viewport } = test.info().project.use;
  await writeJSON(path.join(RAW_RESULTS_DIR, `${journey}.json`), {
    journey,
    settings: {
      browserVersion: browser.version(),
      cpuThrottleRate: CPU_THROTTLE_RATE,
      sampleCount: SAMPLE_COUNT,
      viewport: viewport ? `${viewport.width}×${viewport.height}` : "none",
    },
    metrics,
  } satisfies JourneyResult);
}
