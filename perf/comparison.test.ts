import assert from "node:assert/strict";
import { test } from "node:test";
import { compareRuns, measureNoiseFloor, metricKey } from "./comparison.ts";
import type { NoiseFloor, RunMeta, RunResults } from "./results.ts";

const JOURNEY = "tileInteraction";
const METRIC = "taps.openBoardToGrid";

const META: RunMeta = {
  browserVersion: "156.0.8078.4",
  cpuThrottleRate: 4,
  cpuBenchmarkMs: 10,
  sampleCount: 10,
  viewport: "1280×720",
  os: "Darwin 27.2.0 arm64",
  cpu: "Apple M1 Pro",
  commit: "abc1234",
  isDirty: false,
  buildHash: "0123456789ab",
  date: "2026-11-07 12:00 UTC",
};

function run(
  metrics: Record<string, number[]>,
  meta: Partial<RunMeta> = {},
): RunResults {
  return {
    meta: { ...META, ...meta },
    journeys: [
      {
        journey: JOURNEY,
        settings: META,
        metrics: Object.fromEntries(
          Object.entries(metrics).map(([name, values]) => [
            name,
            { kind: "timing", unit: "ms", description: "", values },
          ]),
        ),
      },
    ],
  };
}

function samplesAround(value: number): number[] {
  return Array.from({ length: 10 }, (_, index) => value + index / 10);
}

function verdictOf(
  baseline: number[],
  current: number[],
  noiseFloor?: NoiseFloor,
): string | undefined {
  const comparison = compareRuns(
    run({ [METRIC]: current }),
    run({ [METRIC]: baseline }),
    noiseFloor,
  );

  return comparison.metrics[0]?.verdict;
}

function noiseFloorOf(percent: number): NoiseFloor {
  return {
    comparisonCount: 1,
    latestDate: META.date,
    percentByMetric: { [metricKey(JOURNEY, METRIC)]: percent },
  };
}

await test("compareRuns has no verdict without a baseline", () => {
  const comparison = compareRuns(
    run({ [METRIC]: samplesAround(100) }),
    undefined,
    undefined,
  );

  assert.equal(comparison.metrics[0]?.verdict, "no baseline");
  assert.deepEqual(comparison.missingMetrics, []);
  assert.deepEqual(comparison.settingDifferences, []);
});

await test("compareRuns flags a clear slowdown as a regression", () => {
  assert.equal(verdictOf(samplesAround(100), samplesAround(150)), "regression");
});

await test("compareRuns flags a clear speedup as an improvement", () => {
  assert.equal(
    verdictOf(samplesAround(150), samplesAround(100)),
    "improvement",
  );
});

await test("compareRuns calls overlapping samples unchanged", () => {
  assert.equal(
    verdictOf([100, 104, 102, 106, 101], [103, 101, 105, 100, 102]),
    "unchanged",
  );
});

await test("compareRuns ignores a significant change smaller than one Event Timing step", () => {
  assert.equal(
    verdictOf(samplesAround(100), samplesAround(101)),
    "within noise",
  );
});

await test("compareRuns requires the default floor before the noise floor is measured", () => {
  assert.equal(
    verdictOf(samplesAround(200), samplesAround(212)),
    "within noise",
  );
});

await test("compareRuns never lets a measured floor drop below the minimum", () => {
  assert.equal(
    verdictOf(samplesAround(200), samplesAround(212), noiseFloorOf(1)),
    "regression",
  );
  assert.equal(
    verdictOf(samplesAround(200), samplesAround(209), noiseFloorOf(1)),
    "within noise",
  );
});

await test("compareRuns lists baseline metrics this run did not measure", () => {
  const comparison = compareRuns(
    run({ [METRIC]: samplesAround(100) }),
    run({
      [METRIC]: samplesAround(100),
      "taps.wordTap": samplesAround(48),
    }),
    undefined,
  );

  assert.deepEqual(comparison.missingMetrics, [
    { journey: JOURNEY, metric: "taps.wordTap" },
  ]);
});

await test("compareRuns lists settings that differ from the baseline", () => {
  const comparison = compareRuns(
    run({}, { browserVersion: "157.0.0.0", cpuBenchmarkMs: 11 }),
    run({}),
    undefined,
  );

  assert.deepEqual(
    comparison.settingDifferences.map(({ setting }) => setting),
    ["browserVersion", "CPU benchmark (machine speed)"],
  );
});

await test("compareRuns tolerates a small change in machine speed", () => {
  const comparison = compareRuns(
    run({}, { cpuBenchmarkMs: 10.4 }),
    run({}),
    undefined,
  );

  assert.deepEqual(comparison.settingDifferences, []);
});

await test("measureNoiseFloor keeps the largest change seen per metric", () => {
  const key = metricKey(JOURNEY, METRIC);
  const baseline = run({ [METRIC]: samplesAround(100) });
  const drifted = run({ [METRIC]: samplesAround(103) });
  const steady = run({ [METRIC]: samplesAround(101) });

  const first = measureNoiseFloor(
    drifted,
    compareRuns(drifted, baseline, undefined),
    undefined,
  );
  const second = measureNoiseFloor(
    steady,
    compareRuns(steady, baseline, first),
    first,
  );

  assert.equal(second.comparisonCount, 2);
  assert.ok(Math.abs((second.percentByMetric[key] ?? 0) - 3) < 0.1);
});

await test("measureNoiseFloor skips metrics that changed from zero", () => {
  const current = run({ [METRIC]: [1, 1, 1] });
  const noiseFloor = measureNoiseFloor(
    current,
    compareRuns(current, run({ [METRIC]: [0, 0, 0] }), undefined),
    undefined,
  );

  assert.deepEqual(noiseFloor.percentByMetric, {});
});
