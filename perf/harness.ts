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
import { ACTION_TIMEOUT_MS } from "./playwright.config.ts";
import {
  PROFILES_DIR,
  RAW_RESULTS_DIR,
  TRACE_SUFFIX,
  writeJSON,
  type JourneyResult,
  type MetricKind,
  type MetricSamples,
  type MetricUnit,
} from "./results.ts";
import { median } from "./stats.ts";

const SAMPLE_COUNT = Number(process.env.PERF_SAMPLES ?? 10);
const CPU_THROTTLE_RATE = 4;
const IS_PROFILING = process.env.PERF_PROFILE === "1";

// Chromium never reports Event Timing entries shorter than this.
const EVENT_TIMING_THRESHOLD_MS = 16;
const MAX_FRAMES_TO_WAIT_FOR_ENTRIES = 120;

export interface Tap {
  start: number;
  duration: number;
  visibleAt: number;
}

interface TapOptions {
  until?: string;
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

  async tap(target: Locator, { until }: TapOptions = {}): Promise<Tap> {
    if (until) {
      await this.watch("tap-target", until);
    }

    const reportedCount = await this.page.evaluate(
      () => window.__perf.interactionDurations.length,
    );
    await target.click();

    return this.page.evaluate(
      async ({
        reportedCount,
        hasTarget,
        maxFrames,
        threshold,
        visibilityTimeout,
      }) => {
        const perf = window.__perf;

        for (let frame = 0; frame < maxFrames; frame += 1) {
          if (perf.interactionDurations.length > reportedCount) {
            break;
          }
          await new Promise(requestAnimationFrame);
        }

        const duration =
          perf.interactionDurations.at(reportedCount) ?? threshold;
        const visibleAt = hasTarget
          ? await perf.visibleAt("tap-target", visibilityTimeout)
          : Number.NaN;

        return { start: perf.lastPointerDown, duration, visibleAt };
      },
      {
        reportedCount,
        hasTarget: until !== undefined,
        maxFrames: MAX_FRAMES_TO_WAIT_FOR_ENTRIES,
        threshold: EVENT_TIMING_THRESHOLD_MS,
        visibilityTimeout: ACTION_TIMEOUT_MS,
      },
    );
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
    }, MAX_FRAMES_TO_WAIT_FOR_ENTRIES);
  }

  async readMemory(): Promise<Memory> {
    await this.#cdp.send("HeapProfiler.collectGarbage");
    const metrics = await this.#readCDPMetrics();

    return {
      heap: metrics.JSHeapUsedSize,
      nodes: metrics.Nodes,
      listeners: metrics.JSEventListeners,
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
  readonly metrics = new Map<string, MetricSamples>();
  cpuBenchmarkMs = Number.NaN;
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
    await page.addInitScript(installPagePerf, {
      watches,
      eventTimingThreshold: EVENT_TIMING_THRESHOLD_MS,
    });

    const cdp = await this.#context.newCDPSession(page);
    await cdp.send("Performance.enable");
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: CPU_THROTTLE_RATE,
    });

    return new PageProbe(page, cdp);
  }

  /**
   * Wraps one measured stretch of a journey. Timing runs record CPU, long
   * animation frame and network deltas for it; profile runs trace it instead.
   */
  async measure(
    probe: PageProbe,
    phase: string,
    steps: () => Promise<void>,
  ): Promise<void> {
    if (IS_PROFILING) {
      await this.#trace(probe, phase, steps);
      return;
    }

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

  async recordTap(metric: TimingMetric, tap: Tap): Promise<void> {
    await this.recordInterval({
      ...metric,
      start: tap.start,
      end: tap.start + tap.duration,
    });
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
    definition: Omit<MetricSamples, "values">,
    value: number,
  ): void {
    const metric = this.metrics.get(name) ?? { ...definition, values: [] };
    metric.values.push(value);
    this.metrics.set(name, metric);
  }
}

/**
 * Runs one discarded warm-up and then SAMPLE_COUNT samples of a journey, each
 * in a fresh browser context, and writes the per-sample values. A profile run
 * traces a single sample instead.
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
    await runSample(browser, journey, runJourney);
    return;
  }

  await runSample(browser, journey, runJourney);

  const samples: JourneySample[] = [];
  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    samples.push(await runSample(browser, journey, runJourney));
  }

  await writeJourneyResult(browser, journey, samples);
}

async function runSample(
  browser: Browser,
  journey: string,
  runJourney: (sample: JourneySample) => Promise<void>,
): Promise<JourneySample> {
  const context = await browser.newContext();

  try {
    const sample = new JourneySample(journey, context);
    sample.cpuBenchmarkMs = await benchmarkCPU(context);
    await runJourney(sample);
    return sample;
  } finally {
    await context.close();
  }
}

/**
 * Times a fixed amount of throttled JavaScript. Code changes cannot move it,
 * so a different result means the machine itself runs faster or slower than
 * before (load, power or thermal state).
 */
async function benchmarkCPU(context: BrowserContext): Promise<number> {
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLE_RATE });

  const duration = await page.evaluate(() => {
    const start = performance.now();
    let total = 0;
    for (let index = 0; index < 2_000_000; index += 1) {
      total += Math.sqrt(index);
    }

    return total > 0 ? performance.now() - start : Number.NaN;
  });

  await page.close();
  return duration;
}

async function writeJourneyResult(
  browser: Browser,
  journey: string,
  samples: JourneySample[],
): Promise<void> {
  // A metric recorded several times in one sample (one per tap) contributes
  // its median, so every sample weighs the same in the comparison.
  const metrics: Record<string, MetricSamples> = {};
  for (const sample of samples) {
    for (const [name, { values, ...definition }] of sample.metrics) {
      metrics[name] ??= { ...definition, values: [] };
      metrics[name].values.push(median(values));
    }
  }

  const { viewport } = test.info().project.use;
  await writeJSON(path.join(RAW_RESULTS_DIR, `${journey}.json`), {
    journey,
    settings: {
      browserVersion: browser.version(),
      cpuThrottleRate: CPU_THROTTLE_RATE,
      cpuBenchmarkMs: median(samples.map((sample) => sample.cpuBenchmarkMs)),
      sampleCount: samples.length,
      viewport: viewport ? `${viewport.width}×${viewport.height}` : "none",
    },
    metrics,
  } satisfies JourneyResult);
}
