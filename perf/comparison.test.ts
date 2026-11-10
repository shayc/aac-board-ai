import assert from "node:assert/strict";
import { test } from "node:test";
import { compareBuilds } from "./comparison.ts";
import type { RunResults, TimingSamples } from "./results.ts";

const TIMING = "openBoardToGrid";
const SAMPLE_COUNT = 10;

function run(timings: Record<string, TimingSamples>): RunResults {
  const settings = {
    browserVersion: "158.0.8127.18",
    cpuSlowdown: 4,
    sampleCount: timings[TIMING]?.base.length ?? SAMPLE_COUNT,
  };
  const build = {
    source: "main",
    commit: "abc1234",
    buildHash: "0123456789ab",
  };

  return {
    date: "2026-11-10 12:00 UTC",
    settings,
    builds: { base: build, current: build },
    journeys: [{ journey: "tileInteraction", settings, timings }],
  };
}

// Each round is slower than the last, the way a warming laptop drifts.
function driftingRounds(shift: number): TimingSamples {
  const base = Array.from(
    { length: SAMPLE_COUNT },
    (_, round) => 100 + round * 5,
  );

  return {
    base,
    current: base.map((value, round) => value + shift + round / 4),
  };
}

await test("compareBuilds flags a slowdown that every round shows", () => {
  const [timing] = compareBuilds(run({ [TIMING]: driftingRounds(3) })).timings;

  assert.equal(timing?.verdict, "regression");
  assert.equal(timing.p, 2 / 2 ** SAMPLE_COUNT);
});

await test("compareBuilds flags a speedup that every round shows", () => {
  const [timing] = compareBuilds(run({ [TIMING]: driftingRounds(-6) })).timings;

  assert.equal(timing?.verdict, "improvement");
});

await test("compareBuilds sees past drift far larger than the change", () => {
  const [timing] = compareBuilds(run({ [TIMING]: driftingRounds(3) })).timings;

  assert.equal(timing?.difference, 4.125);
  assert.deepEqual(timing.differenceInterval, { low: 3.5, high: 4.75 });
  assert.equal(timing.medians.base, 122.5);
});

await test("compareBuilds calls mixed rounds unchanged", () => {
  const [timing] = compareBuilds(
    run({
      [TIMING]: {
        base: [100, 104, 102, 106, 101, 103, 105, 100, 102, 104],
        current: [103, 101, 105, 100, 102, 104, 101, 103, 100, 106],
      },
    }),
  ).timings;

  assert.equal(timing?.verdict, "unchanged");
});

await test("compareBuilds corrects for the number of timings", () => {
  const nineOfTenSlower = {
    base: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    current: [99, 102, 103, 104, 105, 106, 107, 108, 109, 110],
  };
  const steady = {
    base: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    current: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  };
  const alone = compareBuilds(run({ [TIMING]: nineOfTenSlower }));
  const amongOthers = compareBuilds(
    run({
      [TIMING]: nineOfTenSlower,
      ...Object.fromEntries(
        Array.from({ length: 12 }, (_, index) => [`other.${index}`, steady]),
      ),
    }),
  );

  assert.equal(alone.timings[0]?.verdict, "regression");
  assert.equal(amongOthers.timings[0]?.verdict, "unchanged");
});

await test("compareBuilds says when the samples are too few to flag anything", () => {
  const threeRounds = { base: [100, 101, 102], current: [110, 111, 112] };
  const comparison = compareBuilds(run({ [TIMING]: threeRounds }));

  assert.equal(comparison.canFlagChanges, false);
  assert.equal(comparison.timings[0]?.verdict, "unchanged");
  assert.equal(
    compareBuilds(run({ [TIMING]: driftingRounds(3) })).canFlagChanges,
    true,
  );
});

await test("compareBuilds refuses rounds that cannot be paired", () => {
  assert.throws(
    () => compareBuilds(run({ [TIMING]: { base: [1, 2], current: [1] } })),
    /cannot be paired/,
  );
});
