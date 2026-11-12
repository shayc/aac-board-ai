import type { Budget, Unit } from "./budgets.ts";
import type { JourneyResult } from "./results.ts";
import { median } from "./stats.ts";

/** One stray sample in every five is tolerated before a row changes state. */
const SAMPLES_PER_TOLERATED_STRAY = 5;

const STATES = ["over", "watch", "ok"] as const;

export type State = (typeof STATES)[number];

export interface ScorecardRow {
  name: string;
  label: string;
  unit: Unit;
  median: number;
  budget: number;
  state: State;
  overCount: number;
  samples: number[];
}

export interface Scorecard {
  counts: Record<State, number>;
  /** Problems first, then by how often a user meets each one. */
  rows: ScorecardRow[];
}

/** The working tree's samples for every timing the journeys recorded. */
export function collectMeasurements(
  journeys: JourneyResult[],
): Record<string, number[]> {
  const measurements: Record<string, number[]> = {};

  for (const { journey, timings } of journeys) {
    for (const [name, { current = [] }] of Object.entries(timings)) {
      if (name in measurements) {
        throw new Error(
          `${journey} records ${name}, which another journey already records.`,
        );
      }
      measurements[name] = current;
    }
  }

  return measurements;
}

export function scoreMeasurements(
  measurements: Record<string, number[]>,
  budgets: Budget[],
): Scorecard {
  const unbudgeted = Object.keys(measurements).filter(
    (name) => !budgets.some((budget) => budget.name === name),
  );
  if (unbudgeted.length > 0) {
    throw new Error(`No budget is set for ${unbudgeted.join(", ")}.`);
  }

  const rows = budgets.map(({ name, label, unit, limit }) => {
    const samples = measurements[name];
    if (!samples || samples.length === 0) {
      throw new Error(`Nothing measured ${name}, which has a budget.`);
    }

    const overCount = samples.filter((sample) => sample > limit).length;

    return {
      name,
      label,
      unit,
      median: median(samples),
      budget: limit,
      state: stateOf(overCount, samples.length),
      overCount,
      samples,
    };
  });

  return {
    counts: {
      over: countState(rows, "over"),
      watch: countState(rows, "watch"),
      ok: countState(rows, "ok"),
    },
    rows: rows.toSorted(
      (a, b) => STATES.indexOf(a.state) - STATES.indexOf(b.state),
    ),
  };
}

/**
 * A row is settled when nearly every sample lands on one side of its limit.
 * Samples on both sides mean the timing sits at its limit or the machine was
 * busy, and neither is a reason to call the row over.
 */
function stateOf(overCount: number, sampleCount: number): State {
  const strayCount = Math.floor(sampleCount / SAMPLES_PER_TOLERATED_STRAY);

  if (overCount <= strayCount) {
    return "ok";
  }

  return sampleCount - overCount <= strayCount ? "over" : "watch";
}

function countState(rows: ScorecardRow[], state: State): number {
  return rows.filter((row) => row.state === state).length;
}
