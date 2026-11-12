import type { Budget, Unit } from "./budgets.ts";
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
  samples: number[];
}

export interface Scorecard {
  counts: Record<State, number>;
  /** Problems first, then by how often a user meets each one. */
  rows: ScorecardRow[];
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

    return {
      name,
      label,
      unit,
      median: median(samples),
      budget: limit,
      state: stateOf(samples, limit),
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

export function countOverBudget({ samples, budget }: ScorecardRow): number {
  return samples.filter((sample) => sample > budget).length;
}

/**
 * A row is settled when nearly every sample lands on one side of its limit.
 * Samples on both sides mean the timing sits at its limit or the machine was
 * busy, and neither is a reason to call the row over.
 */
function stateOf(samples: number[], limit: number): State {
  const strayCount = Math.floor(samples.length / SAMPLES_PER_TOLERATED_STRAY);
  const overCount = samples.filter((sample) => sample > limit).length;

  if (overCount <= strayCount) {
    return "ok";
  }

  return samples.length - overCount <= strayCount ? "over" : "watch";
}

function countState(rows: ScorecardRow[], state: State): number {
  return rows.filter((row) => row.state === state).length;
}
