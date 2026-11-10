import {
  type Browser,
  type BrowserContext,
  type CDPSession,
  type Locator,
  type Page,
} from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { installPagePerf } from "./page-perf.ts";
import { ACTION_TIMEOUT_MS, BASE_BUILD_URL } from "./playwright.config.ts";
import {
  RAW_RESULTS_DIR,
  type BuildName,
  type JourneyResult,
  type TimingSamples,
} from "./results.ts";
import { median } from "./stats.ts";

const SAMPLE_COUNT = Number(process.env.PERF_SAMPLES ?? 10);
const CPU_SLOWDOWN = 4;
const TAP_RESULT = "tap-result";
const BUILD_NAMES: BuildName[] = ["base", "current"];

export interface Interval {
  start: number;
  end: number;
}

/** One page of a sample, with the in-page probe installed. */
export class PageProbe {
  readonly page: Page;
  readonly #cdp: CDPSession;

  constructor(page: Page, cdp: CDPSession) {
    this.page = page;
    this.#cdp = cdp;
  }

  /**
   * Clicks `target` and waits for the first rendered frame in which `result`
   * is visible. The interval starts at the pointerdown, so it covers
   * everything the page does from the press to that frame.
   */
  async tap(target: Locator, result: string): Promise<Interval> {
    await this.page.evaluate(
      ([name, selector]) => {
        window.__perf.watch(name, selector);
      },
      [TAP_RESULT, result] as const,
    );
    await target.click();

    return {
      start: await this.page.evaluate(() => window.__perf.lastPointerDown),
      end: await this.visibleAt(TAP_RESULT),
    };
  }

  /** When a selector watched since the page opened first rendered. */
  visibleAt(name: string): Promise<number> {
    return this.page.evaluate(
      ([watchName, timeout]) => window.__perf.visibleAt(watchName, timeout),
      [name, ACTION_TIMEOUT_MS] as const,
    );
  }

  /** Slows the CPU for `steps`; whatever surrounds them runs at full speed. */
  async measure(steps: () => Promise<void>): Promise<void> {
    await this.#setCPUSlowdown(CPU_SLOWDOWN);
    try {
      await steps();
    } finally {
      await this.#setCPUSlowdown(1);
    }
  }

  async #setCPUSlowdown(rate: number): Promise<void> {
    await this.#cdp.send("Emulation.setCPUThrottlingRate", { rate });
  }
}

/** One run of a journey in a fresh browser context, and its timings. */
export class JourneySample {
  readonly timings = new Map<string, number[]>();
  readonly #context: BrowserContext;

  constructor(context: BrowserContext) {
    this.#context = context;
  }

  /** `watches` names selectors to time from the start of the page load. */
  async openPage(watches: Record<string, string> = {}): Promise<PageProbe> {
    const page = await this.#context.newPage();
    await page.addInitScript(installPagePerf, watches);

    return new PageProbe(page, await this.#context.newCDPSession(page));
  }

  record(name: string, { start, end }: Interval): void {
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      throw new Error(`Could not measure ${name}: from ${start} to ${end}.`);
    }

    this.timings.set(name, [...(this.timings.get(name) ?? []), end - start]);
  }
}

/**
 * Measures a journey on both builds in SAMPLE_COUNT rounds. A round runs the
 * journey once per build, back to back, so whatever the machine is doing at
 * that moment slows both alike. Each sample gets a fresh browser context, and
 * one warm-up sample per build is discarded.
 */
export async function measureJourney(
  browser: Browser,
  journey: string,
  runJourney: (sample: JourneySample) => Promise<void>,
): Promise<void> {
  for (const build of BUILD_NAMES) {
    await runSample(browser, build, runJourney);
  }

  const samples: Record<BuildName, JourneySample[]> = { base: [], current: [] };
  for (let round = 0; round < SAMPLE_COUNT; round += 1) {
    for (const build of buildOrder(round)) {
      samples[build].push(await runSample(browser, build, runJourney));
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
  build: BuildName,
  runJourney: (sample: JourneySample) => Promise<void>,
): Promise<JourneySample> {
  // The working tree's build is served at the configured baseURL.
  const context = await browser.newContext(
    build === "base" ? { baseURL: BASE_BUILD_URL } : {},
  );

  try {
    const sample = new JourneySample(context);
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
  // A timing recorded several times in one sample (one per tap) contributes
  // its median, so every sample weighs the same in the comparison.
  const timings: Record<string, TimingSamples> = {};
  for (const build of BUILD_NAMES) {
    for (const sample of samples[build]) {
      for (const [name, values] of sample.timings) {
        timings[name] ??= { base: [], current: [] };
        timings[name][build].push(median(values));
      }
    }
  }

  const result: JourneyResult = {
    journey,
    settings: {
      browserVersion: browser.version(),
      cpuSlowdown: CPU_SLOWDOWN,
      sampleCount: SAMPLE_COUNT,
    },
    timings,
  };
  await mkdir(RAW_RESULTS_DIR, { recursive: true });
  await writeFile(
    path.join(RAW_RESULTS_DIR, `${journey}.json`),
    JSON.stringify(result, null, 2),
  );
}
