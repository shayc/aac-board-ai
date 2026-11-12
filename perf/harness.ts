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
import { ACTION_TIMEOUT_MS, BASE_BUILD_URL, ROUND_COUNT } from "./settings.ts";
import { median } from "./stats.ts";

const CPU_SLOWDOWN = 4;
const TAP_RESULT = "tap-result";
const BUILD_NAMES: BuildName[] = ["base", "current"];

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
  async tap(target: Locator, result: string): Promise<TimeSpan> {
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

  visibleAt(name: string): Promise<number> {
    return this.page.evaluate(
      ([watchName, timeout]) => window.__perf.visibleAt(watchName, timeout),
      [name, ACTION_TIMEOUT_MS] as const,
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
 * Pair builds within each round to reduce bias from machine drift.
 * Discard one warm-up sample per build.
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
  for (let round = 0; round < ROUND_COUNT; round += 1) {
    for (const build of buildOrder(round)) {
      samples[build].push(await runSample(browser, build, runJourney));
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
  samples: Record<BuildName, JourneySample[]>,
): Promise<void> {
  // Per-sample medians give samples equal weight regardless of tap count.
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
