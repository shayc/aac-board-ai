import type {
  MetricKind,
  MetricUnit,
  NoiseFloor,
  RunResults,
  RunSettings,
} from "./results.ts";
import { growthSignP, mannWhitneyP, spreadOf, type Spread } from "./stats.ts";

const SIGNIFICANCE_LEVEL = 0.05;
const DEFAULT_NOISE_FLOOR_PERCENT = 10;

// A few same-build runs can understate the noise: on a laptop, runs of one
// build drifted by up to 6% with p < 0.001.
const MIN_NOISE_FLOOR_PERCENT = 5;

const MACHINE_SPEED_TOLERANCE_PERCENT = 5;

// Event Timing reports durations in 8 ms steps, so a smaller timing change
// can be rounding alone.
const MIN_MEANINGFUL_CHANGE: Record<MetricUnit, number> = {
  ms: 8,
  count: 1,
  bytes: 1024,
};

export type Verdict =
  | "regression"
  | "improvement"
  | "within noise"
  | "unchanged"
  | "no baseline";

export interface MetricComparison {
  journey: string;
  metric: string;
  kind: MetricKind;
  unit: MetricUnit;
  current: Spread;
  currentValues: number[];
  baseline?: Spread;
  baselineValues?: number[];
  change?: number;
  changePercent?: number;
  p?: number;
  noiseFloorPercent: number;
  isNoiseFloorMeasured: boolean;
  verdict: Verdict;
}

export interface MemoryGrowth {
  journey: string;
  metric: string;
  unit: MetricUnit;
  medianGrowth: number;
  grewCount: number;
  sampleCount: number;
  p: number;
  isGrowing: boolean;
}

export interface SettingDifference {
  setting: string;
  baseline: string;
  current: string;
}

export interface Comparison {
  metrics: MetricComparison[];
  memory: MemoryGrowth[];
  settingDifferences: SettingDifference[];
}

export function metricKey(journey: string, metric: string): string {
  return `${journey}/${metric}`;
}

export function compareRuns(
  current: RunResults,
  baseline: RunResults | undefined,
  noiseFloor: NoiseFloor | undefined,
): Comparison {
  const metrics: MetricComparison[] = [];
  const memory: MemoryGrowth[] = [];

  for (const journey of current.journeys) {
    const baselineJourney = baseline?.journeys.find(
      ({ journey: name }) => name === journey.journey,
    );

    for (const [metric, samples] of Object.entries(journey.metrics)) {
      const key = metricKey(journey.journey, metric);
      metrics.push(
        compareMetric({
          journey: journey.journey,
          metric,
          kind: samples.kind,
          unit: samples.unit,
          currentValues: samples.values,
          baselineValues: baselineJourney?.metrics[metric]?.values,
          noiseFloorPercent: noiseFloor?.percentByMetric[key],
        }),
      );

      if (samples.kind === "memory") {
        memory.push(
          memoryGrowthOf(journey.journey, metric, samples.unit, samples.values),
        );
      }
    }
  }

  return {
    metrics,
    memory,
    settingDifferences: baseline
      ? differingSettings(baseline.meta, current.meta)
      : [],
  };
}

interface MetricInput {
  journey: string;
  metric: string;
  kind: MetricKind;
  unit: MetricUnit;
  currentValues: number[];
  baselineValues: number[] | undefined;
  noiseFloorPercent: number | undefined;
}

function compareMetric(input: MetricInput): MetricComparison {
  const { currentValues, baselineValues, unit } = input;
  const noiseFloorPercent = Math.max(
    input.noiseFloorPercent ?? DEFAULT_NOISE_FLOOR_PERCENT,
    MIN_NOISE_FLOOR_PERCENT,
  );
  const comparison: MetricComparison = {
    journey: input.journey,
    metric: input.metric,
    kind: input.kind,
    unit,
    current: spreadOf(currentValues),
    currentValues,
    noiseFloorPercent,
    isNoiseFloorMeasured: input.noiseFloorPercent !== undefined,
    verdict: "no baseline",
  };

  if (!baselineValues || baselineValues.length === 0) {
    return comparison;
  }

  const baseline = spreadOf(baselineValues);
  const change = comparison.current.median - baseline.median;
  const changePercent = percentChange(baseline.median, change);
  const p = mannWhitneyP(baselineValues, currentValues);

  const isSignificant = p < SIGNIFICANCE_LEVEL;
  const isAboveNoise =
    Math.abs(change) >= MIN_MEANINGFUL_CHANGE[unit] &&
    Math.abs(changePercent) > noiseFloorPercent;

  return {
    ...comparison,
    baseline,
    baselineValues,
    change,
    changePercent,
    p,
    verdict: verdictOf(isSignificant, isAboveNoise, change),
  };
}

function percentChange(from: number, change: number): number {
  if (from !== 0) {
    return (change / from) * 100;
  }

  return change === 0 ? 0 : Number.POSITIVE_INFINITY;
}

function verdictOf(
  isSignificant: boolean,
  isAboveNoise: boolean,
  change: number,
): Verdict {
  if (!isSignificant) {
    return "unchanged";
  }
  if (!isAboveNoise) {
    return "within noise";
  }

  return change > 0 ? "regression" : "improvement";
}

function memoryGrowthOf(
  journey: string,
  metric: string,
  unit: MetricUnit,
  growths: number[],
): MemoryGrowth {
  const p = growthSignP(growths);

  return {
    journey,
    metric,
    unit,
    medianGrowth: spreadOf(growths).median,
    grewCount: growths.filter((growth) => growth > 0).length,
    sampleCount: growths.length,
    p,
    isGrowing: p < SIGNIFICANCE_LEVEL,
  };
}

function differingSettings(
  baseline: RunSettings,
  current: RunSettings,
): SettingDifference[] {
  const settings: (keyof RunSettings)[] = [
    "browserVersion",
    "cpuThrottleRate",
    "sampleCount",
    "viewport",
    "os",
    "cpu",
  ];

  const differences = settings
    .filter((setting) => String(baseline[setting]) !== String(current[setting]))
    .map((setting): SettingDifference => ({
      setting,
      baseline: String(baseline[setting]),
      current: String(current[setting]),
    }));

  if (!isSameMachineSpeed(baseline, current)) {
    differences.push({
      setting: "CPU benchmark (machine speed)",
      baseline: `${baseline.cpuBenchmarkMs.toFixed(1)} ms`,
      current: `${current.cpuBenchmarkMs.toFixed(1)} ms`,
    });
  }

  return differences;
}

function isSameMachineSpeed(
  baseline: RunSettings,
  current: RunSettings,
): boolean {
  const changePercent =
    ((current.cpuBenchmarkMs - baseline.cpuBenchmarkMs) /
      baseline.cpuBenchmarkMs) *
    100;

  return Math.abs(changePercent) <= MACHINE_SPEED_TOLERANCE_PERCENT;
}

/**
 * Two runs of the same build differ only by noise, so their per-metric change
 * becomes the floor a later change has to clear. One pair can understate the
 * noise, so the floor keeps the largest change seen across such pairs.
 */
export function measureNoiseFloor(
  current: RunResults,
  comparison: Comparison,
  previous: NoiseFloor | undefined,
): NoiseFloor {
  const percentByMetric = { ...previous?.percentByMetric };

  for (const { journey, metric, changePercent } of comparison.metrics) {
    if (changePercent === undefined || !Number.isFinite(changePercent)) {
      continue;
    }

    const key = metricKey(journey, metric);
    percentByMetric[key] = Math.max(
      percentByMetric[key] ?? 0,
      Math.abs(changePercent),
    );
  }

  return {
    comparisonCount: (previous?.comparisonCount ?? 0) + 1,
    latestDate: current.meta.date,
    percentByMetric,
  };
}
