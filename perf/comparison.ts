import type { BuildName, RunResults, TimingSamples } from "./results.ts";
import {
  differenceInterval,
  holmAdjust,
  median,
  signedRankP,
  smallestSignedRankP,
  typicalDifference,
  type Interval,
} from "./stats.ts";

export const SIGNIFICANCE_LEVEL = 0.05;
export const CONFIDENCE_LEVEL = 0.95;

export type Verdict = "regression" | "improvement" | "unchanged";

export interface TimingComparison {
  journey: string;
  timing: string;
  medians: Record<BuildName, number>;
  difference: number;
  differencePercent: number;
  differenceInterval: Interval | undefined;
  p: number;
  verdict: Verdict;
}

export interface Comparison {
  timings: TimingComparison[];
  canFlagChanges: boolean;
}

/**
 * Tests each timing's per-round differences and corrects the p-values for the
 * number of timings, so two builds that perform alike get any flag at all in
 * fewer than SIGNIFICANCE_LEVEL of runs.
 */
export function compareBuilds(results: RunResults): Comparison {
  const measured = results.journeys.flatMap(({ journey, timings }) =>
    Object.entries(timings).map(([timing, samples]) => ({
      journey,
      timing,
      samples,
      differences: roundDifferences(journey, timing, samples),
    })),
  );
  const adjustedPs = holmAdjust(
    measured.map(({ differences }) => signedRankP(differences)),
  );

  return {
    timings: measured.map(
      ({ journey, timing, samples, differences }, index) => {
        const difference = typicalDifference(differences);
        const baseMedian = median(samples.base);
        const p = adjustedPs[index] ?? 1;

        return {
          journey,
          timing,
          medians: { base: baseMedian, current: median(samples.current) },
          difference,
          differencePercent: (difference / baseMedian) * 100,
          differenceInterval: differenceInterval(differences, CONFIDENCE_LEVEL),
          p,
          verdict: verdictOf(p, difference),
        };
      },
    ),
    canFlagChanges:
      smallestSignedRankP(results.settings.sampleCount) * measured.length <=
      SIGNIFICANCE_LEVEL,
  };
}

function roundDifferences(
  journey: string,
  timing: string,
  { base, current }: TimingSamples,
): number[] {
  if (base.length !== current.length) {
    throw new Error(
      `${journey} › ${timing} has ${base.length} base and ${current.length} current samples, so its rounds cannot be paired.`,
    );
  }

  return current.map((value, round) => value - (base[round] ?? Number.NaN));
}

function verdictOf(p: number, difference: number): Verdict {
  if (p >= SIGNIFICANCE_LEVEL) {
    return "unchanged";
  }

  return difference > 0 ? "regression" : "improvement";
}
