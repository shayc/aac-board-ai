import { beforeAll, describe, expect, test } from "vitest";
import { page } from "vitest/browser";
import { startCollector } from "./collector";
import type { PerfHarness } from "./perf-snapshot";
import { trackInputEvents } from "./spans";

const SLOW_HANDLER_MS = 80;

function getHarness(): PerfHarness {
  const harness = window.__perf;
  if (!harness) {
    throw new Error("Collector did not install its harness");
  }

  return harness;
}

function blockMainThread(duration: number): void {
  const until = performance.now() + duration;
  while (performance.now() < until) {
    // Busy-wait.
  }
}

describe("startCollector", () => {
  beforeAll(() => {
    trackInputEvents();
    startCollector();
  });

  test("scopes snapshots to the window that the harness begins", async () => {
    const harness = getHarness();

    const windowStart = harness.beginWindow();
    await harness.settle();
    const snapshot = harness.snapshot();

    expect(snapshot.windowStart).toBe(windowStart);
    expect(snapshot.operations).toEqual([]);
    expect(
      snapshot.resources.every((resource) => resource.startTime >= windowStart),
    ).toBe(true);
    await expect
      .poll(() => harness.snapshot().vitals.map((vital) => vital.name))
      .toContain("TTFB");
  });

  test("records requests and interactions without their text", async () => {
    const harness = getHarness();
    harness.beginWindow();
    const button = document.createElement("button");
    button.textContent = "Speak my secret phrase";
    button.addEventListener("click", () => blockMainThread(SLOW_HANDLER_MS));
    document.body.append(button);

    await fetch("/board.svg");
    await page.getByRole("button", { name: "Speak my secret phrase" }).click();

    await expect
      .poll(() => harness.snapshot().resources.map((resource) => resource.url))
      .toContain("/board.svg");
    await expect
      .poll(() => harness.snapshot().interactions.at(-1))
      .toMatchObject({ target: "button" });
    expect(JSON.stringify(harness.snapshot())).not.toContain("secret");
    button.remove();
  });
});
