import type {
  Browser,
  BrowserContext,
  CDPSession,
  FileChooser,
  Locator,
  Page,
  Request,
} from "@playwright/test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { installPagePerf } from "./page-perf.ts";
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
const MAX_FRAMES_TO_WAIT_FOR_EVENT_TIMING = 120;

export interface Tap {
  start: number;
  duration: number;
  visibleAt: number;
}

interface TapOptions {
  until?: string;
}

interface Memory {
  heap: number;
  nodes: number;
  listeners: number;
}

class SampleValues {
  readonly #values = new Map<string, MetricSamples>();

  add(name: string, value: number, unit: MetricUnit, kind: MetricKind): void {
    const metric = this.#values.get(name) ?? { kind, unit, values: [] };
    metric.values.push(value);
    this.#values.set(name, metric);
  }

  // A metric recorded several times in one sample (one per tap) contributes
  // its median, so every sample weighs the same in the comparison.
  medians(): Map<
    string,
    { kind: MetricKind; unit: MetricUnit; value: number }
  > {
    return new Map(
      [...this.#values].map(([name, { kind, unit, values }]) => [
        name,
        { kind, unit, value: median(values) },
      ]),
    );
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

export class PageProbe {
  readonly page: Page;
  readonly #cdp: CDPSession;
  readonly #sample: JourneySample;

  constructor(page: Page, cdp: CDPSession, sample: JourneySample) {
    this.page = page;
    this.#cdp = cdp;
    this.#sample = sample;
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
      async ({ reportedCount, hasTarget, maxFrames, threshold }) => {
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
          ? ((await perf.visibleAt.get("tap-target")) ?? Number.NaN)
          : Number.NaN;

        return { start: perf.lastPointerDown, duration, visibleAt };
      },
      {
        reportedCount,
        hasTarget: until !== undefined,
        maxFrames: MAX_FRAMES_TO_WAIT_FOR_EVENT_TIMING,
        threshold: EVENT_TIMING_THRESHOLD_MS,
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
      (watchName) => window.__perf.visibleAt.get(watchName) ?? Number.NaN,
      name,
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

  async recordInterval(
    name: string,
    start: number,
    end: number,
  ): Promise<void> {
    if (Number.isNaN(end)) {
      return;
    }
    this.#sample.values.add(name, end - start, "ms", "timing");

    if (IS_PROFILING) {
      await this.page.evaluate(
        ([label, from, to]) =>
          performance.measure(label, { start: from, end: to }),
        [name, start, end] as const,
      );
    }
  }

  async recordTap(name: string, tap: Tap): Promise<void> {
    await this.recordInterval(name, tap.start, tap.start + tap.duration);
  }

  async recordPaints(phase: string): Promise<void> {
    const paints = await this.page.evaluate(() => ({
      firstContentful:
        performance.getEntriesByName("first-contentful-paint")[0]?.startTime ??
        Number.NaN,
      largestContentful: window.__perf.largestPaint,
    }));

    await this.recordInterval(`${phase}.fcp`, 0, paints.firstContentful);
    await this.recordInterval(`${phase}.lcp`, 0, paints.largestContentful);
  }

  async readMemory(): Promise<Memory> {
    await this.#cdp.send("HeapProfiler.collectGarbage");
    const metrics = await this.#readMetrics();

    return {
      heap: metrics.JSHeapUsedSize,
      nodes: metrics.Nodes,
      listeners: metrics.JSEventListeners,
    };
  }

  recordMemoryGrowth(phase: string, start: Memory, end: Memory): void {
    const { values } = this.#sample;
    values.add(`${phase}.heapGrowth`, end.heap - start.heap, "bytes", "memory");
    values.add(
      `${phase}.nodeGrowth`,
      end.nodes - start.nodes,
      "count",
      "memory",
    );
    values.add(
      `${phase}.listenerGrowth`,
      end.listeners - start.listeners,
      "count",
      "memory",
    );
  }

  /**
   * Wraps one measured stretch of a journey. Timing runs record CPU, long
   * animation frame and network deltas for it; profile runs trace it instead.
   */
  async measure(phase: string, steps: () => Promise<void>): Promise<void> {
    if (IS_PROFILING) {
      await this.#profile(phase, steps);
      return;
    }

    const counter = this.#sample.requests;
    const before = {
      metrics: await this.#readMetrics(),
      requests: counter.requests,
      failed: counter.failed,
      page: await this.#readPageState(),
    };

    await steps();

    const after = {
      metrics: await this.#readMetrics(),
      requests: counter.requests,
      failed: counter.failed,
      page: await this.#readPageState(),
    };
    const isSameDocument = before.page.timeOrigin === after.page.timeOrigin;

    this.#recordCPU(phase, before.metrics, after.metrics);
    await this.#recordLongFrames(phase, isSameDocument ? before.page.now : 0);

    const { values } = this.#sample;
    values.add(
      `${phase}.requests`,
      after.requests - before.requests,
      "count",
      "network",
    );
    values.add(
      `${phase}.failedRequests`,
      after.failed - before.failed,
      "count",
      "network",
    );
    values.add(
      `${phase}.bytes`,
      after.page.transferred - (isSameDocument ? before.page.transferred : 0),
      "bytes",
      "network",
    );
  }

  async #profile(phase: string, steps: () => Promise<void>): Promise<void> {
    const browser = this.page.context().browser();
    if (!browser) {
      throw new Error("Profiling needs a launched browser.");
    }

    const prefix = path.join(PROFILES_DIR, this.#sample.journey, phase);
    await this.#writeHeapSnapshot(`${prefix}.before.heapsnapshot`);
    await browser.startTracing(this.page, {
      path: `${prefix}${TRACE_SUFFIX}`,
      screenshots: true,
    });

    await steps();

    await browser.stopTracing();
    await this.#writeHeapSnapshot(`${prefix}.after.heapsnapshot`);
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

  async #readMetrics(): Promise<Record<string, number>> {
    const { metrics } = await this.#cdp.send("Performance.getMetrics");

    return Object.fromEntries(metrics.map(({ name, value }) => [name, value]));
  }

  // Service worker fetches have their own timeline, so this covers what the
  // page itself downloaded.
  #readPageState(): Promise<{
    timeOrigin: number;
    now: number;
    transferred: number;
  }> {
    return this.page.evaluate(() => ({
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
  }

  #recordCPU(
    phase: string,
    before: Record<string, number>,
    after: Record<string, number>,
  ): void {
    const cpuMetrics = {
      task: "TaskDuration",
      script: "ScriptDuration",
      layout: "LayoutDuration",
      style: "RecalcStyleDuration",
    };

    for (const [name, metric] of Object.entries(cpuMetrics)) {
      const seconds = (after[metric] ?? 0) - (before[metric] ?? 0);
      this.#sample.values.add(
        `${phase}.cpu.${name}`,
        seconds * 1000,
        "ms",
        "cpu",
      );
    }
  }

  async #recordLongFrames(phase: string, phaseStart: number): Promise<void> {
    const frames = (
      await this.page.evaluate(() => window.__perf.longFrames)
    ).filter((frame) => frame.start >= phaseStart);
    const { values } = this.#sample;

    values.add(`${phase}.longFrames`, frames.length, "count", "frames");
    values.add(
      `${phase}.blocking`,
      frames.reduce((total, frame) => total + frame.blockingDuration, 0),
      "ms",
      "frames",
    );
  }
}

export class JourneySample {
  readonly journey: string;
  readonly values = new SampleValues();
  readonly requests: RequestCounter;
  viewport: JourneyResult["viewport"] = null;
  cpuBenchmarkMs = Number.NaN;
  readonly #context: BrowserContext;

  constructor(journey: string, context: BrowserContext) {
    this.journey = journey;
    this.#context = context;
    this.requests = new RequestCounter(context);
  }

  async openPage(watches: Record<string, string> = {}): Promise<PageProbe> {
    const page = await this.#context.newPage();
    await page.addInitScript(installPagePerf, {
      watches,
      eventTimingThreshold: EVENT_TIMING_THRESHOLD_MS,
    });
    this.viewport = page.viewportSize();

    const cdp = await this.#context.newCDPSession(page);
    await cdp.send("Performance.enable");
    await cdp.send("Emulation.setCPUThrottlingRate", {
      rate: CPU_THROTTLE_RATE,
    });

    return new PageProbe(page, cdp, this);
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
  const metrics: Record<string, MetricSamples> = {};
  for (const { values } of samples) {
    for (const [name, { kind, unit, value }] of values.medians()) {
      metrics[name] ??= { kind, unit, values: [] };
      metrics[name].values.push(value);
    }
  }

  await writeJSON(path.join(RAW_RESULTS_DIR, `${journey}.json`), {
    journey,
    browserVersion: browser.version(),
    cpuThrottleRate: CPU_THROTTLE_RATE,
    cpuBenchmarkMs: median(samples.map(({ cpuBenchmarkMs }) => cpuBenchmarkMs)),
    viewport: samples[0]?.viewport ?? null,
    sampleCount: samples.length,
    metrics,
  } satisfies JourneyResult);
}
