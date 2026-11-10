import type {
  BuildName,
  MetricKind,
  MetricSamples,
  MetricUnit,
  RunResults,
} from "./results.ts";
import {
  differenceInterval,
  growthSignP,
  holmAdjust,
  median,
  signedRankP,
  smallestSignedRankP,
  spreadOf,
  typicalDifference,
  type Interval,
  type Spread,
} from "./stats.ts";

export const SIGNIFICANCE_LEVEL = 0.05;
export const CONFIDENCE_LEVEL = 0.95;

// Timings are what a user waits for, so they are the metrics that get a
// verdict. The other kinds explain a timing that moved.
const TESTED_KIND: MetricKind = "timing";

export type Verdict = "regression" | "improvement" | "unchanged";

export interface MetricComparison {
  journey: string;
  metric: string;
  kind: MetricKind;
  unit: MetricUnit;
  description: string;
  samples: Record<BuildName, number[]>;
  spreads: Record<BuildName, Spread>;
  difference: number;
  differencePercent: number;
  differenceInterval: Interval | undefined;
  test?: { p: number; verdict: Verdict };
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

export interface Comparison {
  metrics: MetricComparison[];
  memory: MemoryGrowth[];
  canFlagChanges: boolean;
}

export function compareBuilds(results: RunResults): Comparison {
  const measured = results.journeys.flatMap(({ journey, metrics }) =>
    Object.entries(metrics).map(([metric, samples]) => ({
      journey,
      metric,
      samples,
    })),
  );

  const metrics = measured.map(({ journey, metric, samples }) =>
    compareMetric(journey, metric, samples),
  );
  const tested = metrics.filter(({ kind }) => kind === TESTED_KIND);
  const adjustedPs = holmAdjust(
    tested.map(({ samples }) => signedRankP(roundDifferences(samples))),
  );
  tested.forEach((metric, index) => {
    const p = adjustedPs[index] ?? 1;
    metric.test = { p, verdict: verdictOf(p, metric.difference) };
  });

  return {
    metrics,
    memory: measured
      .filter(({ samples }) => samples.kind === "memory")
      .map(({ journey, metric, samples }) =>
        memoryGrowthOf(journey, metric, samples.unit, samples.current),
      ),
    canFlagChanges:
      smallestSignedRankP(results.meta.sampleCount) * tested.length <=
      SIGNIFICANCE_LEVEL,
  };
}

function compareMetric(
  journey: string,
  metric: string,
  { kind, unit, description, base, current }: MetricSamples,
): MetricComparison {
  if (base.length !== current.length) {
    throw new Error(
      `${journey} › ${metric} has ${base.length} base and ${current.length} current samples, so its rounds cannot be paired.`,
    );
  }

  const differences = roundDifferences({ base, current });
  const difference = typicalDifference(differences);
  const spreads = { base: spreadOf(base), current: spreadOf(current) };

  return {
    journey,
    metric,
    kind,
    unit,
    description,
    samples: { base, current },
    spreads,
    difference,
    differencePercent: percentOf(difference, spreads.base.median),
    differenceInterval: differenceInterval(differences, CONFIDENCE_LEVEL),
  };
}

function roundDifferences({
  base,
  current,
}: Record<BuildName, number[]>): number[] {
  return current.map((value, round) => value - (base[round] ?? Number.NaN));
}

function percentOf(difference: number, from: number): number {
  if (from !== 0) {
    return (difference / from) * 100;
  }

  return difference === 0 ? 0 : Number.POSITIVE_INFINITY;
}

function verdictOf(p: number, difference: number): Verdict {
  if (p >= SIGNIFICANCE_LEVEL) {
    return "unchanged";
  }

  return difference > 0 ? "regression" : "improvement";
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
    medianGrowth: median(growths),
    grewCount: growths.filter((growth) => growth > 0).length,
    sampleCount: growths.length,
    p,
    isGrowing: p < SIGNIFICANCE_LEVEL,
  };
}
