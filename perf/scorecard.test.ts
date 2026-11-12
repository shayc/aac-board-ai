import assert from "node:assert/strict";
import { test } from "node:test";
import type { Budget } from "./budgets.ts";
import { collectMeasurements, scoreMeasurements } from "./scorecard.ts";

const TAP: Budget = { name: "tap", label: "tap", unit: "ms", limit: 100 };
const SIZE: Budget = { name: "size", label: "size", unit: "kB", limit: 400 };

function stateOf(samples: number[]): string | undefined {
  return scoreMeasurements({ tap: samples }, [TAP]).rows[0]?.state;
}

await test("scoreMeasurements passes a row whose samples stay within budget", () => {
  assert.equal(stateOf([30, 31, 29, 32, 100]), "ok");
});

await test("scoreMeasurements ignores one stray sample in five", () => {
  assert.equal(stateOf([30, 31, 29, 32, 240]), "ok");
  assert.equal(stateOf([130, 131, 129, 132, 40]), "over");
});

await test("scoreMeasurements watches a row whose samples fall on both sides", () => {
  assert.equal(stateOf([90, 95, 98, 104, 110]), "watch");
  assert.equal(stateOf([90, 95, 110, 120, 125]), "watch");
});

await test("scoreMeasurements settles a single measurement either way", () => {
  assert.equal(stateOf([100]), "ok");
  assert.equal(stateOf([101]), "over");
});

await test("scoreMeasurements reports the median against the budget", () => {
  const [row] = scoreMeasurements({ tap: [30, 50, 40] }, [TAP]).rows;

  assert.equal(row?.median, 40);
  assert.equal(row.budget, 100);
});

await test("scoreMeasurements puts problems first and keeps budget order within a state", () => {
  const third: Budget = { ...TAP, name: "third" };
  const { rows, counts } = scoreMeasurements(
    { tap: [30], size: [412], third: [20] },
    [TAP, SIZE, third],
  );

  assert.deepEqual(
    rows.map((row) => row.name),
    ["size", "tap", "third"],
  );
  assert.deepEqual(counts, { over: 1, watch: 0, ok: 2 });
});

await test("scoreMeasurements refuses a measurement that has no budget", () => {
  assert.throws(
    () => scoreMeasurements({ tap: [30], swipe: [20] }, [TAP]),
    /No budget is set for swipe/,
  );
});

await test("scoreMeasurements refuses a budget that nothing measured", () => {
  assert.throws(
    () => scoreMeasurements({ tap: [30] }, [TAP, SIZE]),
    /Nothing measured size/,
  );
});

await test("collectMeasurements gathers the working tree's samples from every journey", () => {
  const settings = { browserVersion: "158.0", cpuSlowdown: 4, roundCount: 2 };

  assert.deepEqual(
    collectMeasurements([
      {
        journey: "startup",
        settings,
        timings: { launch: { current: [1, 2] } },
      },
      { journey: "tiles", settings, timings: { tap: { current: [3, 4] } } },
    ]),
    { launch: [1, 2], tap: [3, 4] },
  );
});

await test("collectMeasurements refuses a timing that two journeys record", () => {
  const settings = { browserVersion: "158.0", cpuSlowdown: 4, roundCount: 1 };

  assert.throws(
    () =>
      collectMeasurements([
        { journey: "startup", settings, timings: { tap: { current: [1] } } },
        { journey: "tiles", settings, timings: { tap: { current: [3] } } },
      ]),
    /tiles records tap, which another journey already records/,
  );
});
