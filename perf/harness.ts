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
import { RAW_RESULTS_DIR } from "./paths.ts";
import type { BuildName, JourneyResult, TimingSamples } from "./results.ts";
import {
  ACTION_TIMEOUT_MS,
  BASE_BUILD_URL,
  BUILD_NAMES,
  CPU_SLOWDOWN,
  ROUND_COUNT,
} from "./settings.ts";
import { median } from "./stats.ts";

const TAP_RESULT = "tap-result";

interface MeasuredSample {
  build: BuildName;
  sample: JourneySample;
}

export interface TimeSpan {
  start: number;
  end: number;
}

export class PageProbe {
  readonly page: Page;
  readonly #cdp: CDPSession;

  constructor(page: Page, cdp: CDPSession) {
    this.page = page;
    this.#cdp = cdp;
  }

  /** Measures pointerdown to the first painted frame containing `result`. */
  async tap(
    target: Locator,
    result: string,
    timeoutMs = ACTION_TIMEOUT_MS,
  ): Promise<TimeSpan> {
    await this.page.evaluate(
      ([name, selector]) => {
        window.__perf.watch(name, selector);
      },
      [TAP_RESULT, result] as const,
    );
    await target.click();

    return {
      start: await this.page.evaluate(() => window.__perf.lastPointerDown),
      end: await this.visibleAt(TAP_RESULT, timeoutMs),
    };
  }

  visibleAt(name: string, timeoutMs = ACTION_TIMEOUT_MS): Promise<number> {
    return this.page.evaluate(
      ([watchName, timeout]) => window.__perf.visibleAt(watchName, timeout),
      [name, timeoutMs] as const,
    );
  }

  async slowCPUDuring(steps: () => Promise<void>): Promise<void> {
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

  record(name: string, { start, end }: TimeSpan): void {
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      throw new Error(`Could not measure ${name}: from ${start} to ${end}.`);
    }

    this.timings.set(name, [...(this.timings.get(name) ?? []), end - start]);
  }
}

/**
 * Measures every build once per round, after one discarded warm-up sample
 * each. A comparison pairs its two builds within a round to reduce bias from
 * machine drift.
 */
export async function measureJourney(
  browser: Browser,
  journey: string,
  runJourney: (sample: JourneySample) => Promise<void>,
): Promise<void> {
  for (const build of BUILD_NAMES) {
    await runSample(browser, build, runJourney);
  }

  const samples: MeasuredSample[] = [];
  for (let round = 0; round < ROUND_COUNT; round += 1) {
    for (const build of buildOrder(round)) {
      samples.push({
        build,
        sample: await runSample(browser, build, runJourney),
      });
    }
  }

  await writeJourneyResult(browser, journey, samples);
}

// Alternate order to balance the second build's warmer caches.
function buildOrder(round: number): BuildName[] {
  return round % 2 === 0 ? BUILD_NAMES : BUILD_NAMES.toReversed();
}

async function runSample(
  browser: Browser,
  build: BuildName,
  runJourney: (sample: JourneySample) => Promise<void>,
): Promise<JourneySample> {
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
  samples: MeasuredSample[],
): Promise<void> {
  // Per-sample medians give samples equal weight regardless of tap count.
  const timings: Record<string, TimingSamples> = {};
  for (const { build, sample } of samples) {
    for (const [name, values] of sample.timings) {
      const timing = (timings[name] ??= {});
      (timing[build] ??= []).push(median(values));
    }
  }

  const result: JourneyResult = {
    journey,
    settings: {
      browserVersion: browser.version(),
      cpuSlowdown: CPU_SLOWDOWN,
      roundCount: ROUND_COUNT,
    },
    timings,
  };
  await mkdir(RAW_RESULTS_DIR, { recursive: true });
  await writeFile(
    path.join(RAW_RESULTS_DIR, `${journey}.json`),
    JSON.stringify(result, null, 2),
  );
}
