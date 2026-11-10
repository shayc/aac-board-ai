import assert from "node:assert/strict";
import { test } from "node:test";
import { compareBuilds } from "./comparison.ts";
import type { BuildName, MetricKind, RunResults } from "./results.ts";

const JOURNEY = "tileInteraction";
const METRIC = "taps.openBoardToGrid";
const SAMPLE_COUNT = 10;

type Samples = Record<BuildName, number[]>;

function run(
  metrics: Record<string, Samples>,
  kind: MetricKind = "timing",
): RunResults {
  const settings = {
    browserVersion: "156.0.8078.4",
    cpuThrottleRate: 4,
    sampleCount: metrics[METRIC]?.base.length ?? SAMPLE_COUNT,
    viewport: "1280×720",
  };
  const build = {
    source: "main",
    commit: "abc1234",
    buildHash: "0123456789ab",
  };

  return {
    meta: {
      ...settings,
      builds: { base: build, current: build },
      date: "2026-11-10 12:00 UTC",
      os: "Darwin 27.2.0 arm64",
      cpu: "Apple M1 Pro",
    },
    journeys: [
      {
        journey: JOURNEY,
        settings,
        metrics: Object.fromEntries(
          Object.entries(metrics).map(([name, samples]) => [
            name,
            { kind, unit: "ms", description: "", ...samples },
          ]),
        ),
      },
    ],
  };
}

// Each round is slower than the last, the way a warming laptop drifts.
function driftingRounds(shift: number): Samples {
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
  const [metric] = compareBuilds(run({ [METRIC]: driftingRounds(3) })).metrics;

  assert.equal(metric?.test?.verdict, "regression");
  assert.equal(metric.test.p, 2 / 2 ** SAMPLE_COUNT);
});

await test("compareBuilds flags a speedup that every round shows", () => {
  const [metric] = compareBuilds(run({ [METRIC]: driftingRounds(-3) })).metrics;

  assert.equal(metric?.test?.verdict, "improvement");
});

await test("compareBuilds sees past drift far larger than the change", () => {
  const [metric] = compareBuilds(run({ [METRIC]: driftingRounds(3) })).metrics;

  assert.ok(Math.abs((metric?.difference ?? 0) - 4.125) < 1e-9);
  assert.deepEqual(metric?.differenceInterval, { low: 3.5, high: 4.75 });
});

await test("compareBuilds calls mixed rounds unchanged", () => {
  const [metric] = compareBuilds(
    run({
      [METRIC]: {
        base: [100, 104, 102, 106, 101, 103, 105, 100, 102, 104],
        current: [103, 101, 105, 100, 102, 104, 101, 103, 100, 106],
      },
    }),
  ).metrics;

  assert.equal(metric?.test?.verdict, "unchanged");
});

await test("compareBuilds corrects for the number of timings", () => {
  const nineOfTenSlower = {
    base: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    current: [99, 102, 103, 104, 105, 106, 107, 108, 109, 110],
  };
  const alone = compareBuilds(run({ [METRIC]: nineOfTenSlower }));
  const amongOthers = compareBuilds(
    run({
      [METRIC]: nineOfTenSlower,
      ...Object.fromEntries(
        Array.from({ length: 12 }, (_, index) => [
          `other.${index}`,
          {
            base: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            current: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          },
        ]),
      ),
    }),
  );

  assert.equal(alone.metrics[0]?.test?.verdict, "regression");
  assert.equal(amongOthers.metrics[0]?.test?.verdict, "unchanged");
});

await test("compareBuilds gives a verdict to timings only", () => {
  const [metric] = compareBuilds(
    run({ [METRIC]: driftingRounds(3) }, "cpu"),
  ).metrics;

  assert.equal(metric?.test, undefined);
  assert.ok((metric?.difference ?? 0) > 0);
});

await test("compareBuilds says when the samples are too few to flag anything", () => {
  const threeRounds = { base: [100, 101, 102], current: [110, 111, 112] };
  const comparison = compareBuilds(run({ [METRIC]: threeRounds }));

  assert.equal(comparison.canFlagChanges, false);
  assert.equal(comparison.metrics[0]?.test?.verdict, "unchanged");
  assert.equal(
    compareBuilds(run({ [METRIC]: driftingRounds(3) })).canFlagChanges,
    true,
  );
});

await test("compareBuilds refuses rounds that cannot be paired", () => {
  assert.throws(
    () => compareBuilds(run({ [METRIC]: { base: [1, 2], current: [1] } })),
    /cannot be paired/,
  );
});

await test("compareBuilds reports memory that grows in the current build", () => {
  const growth = {
    base: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    current: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  };
  const { memory } = compareBuilds(run({ [METRIC]: growth }, "memory"));

  assert.equal(memory[0]?.isGrowing, true);
  assert.equal(memory[0].grewCount, 10);
});
