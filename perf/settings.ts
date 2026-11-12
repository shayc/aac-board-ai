import type { BuildName } from "./results.ts";

export const ACTION_TIMEOUT_MS = 15_000;
export const IMPORT_TIMEOUT_MS = 60_000;
export const BASE_BUILD_URL = "http://127.0.0.1:4174";

/**
 * The timing limits in budgets.ts were measured at this slowdown. Changing it
 * shifts every timing, so re-measure them in the same change.
 */
export const CPU_SLOWDOWN = 4;

const XRAY_ROUND_COUNT = 5;
const COMPARISON_ROUND_COUNT = 10;

/** `npm run perf` passes --base to the journeys as PERF_COMPARISON. */
export const IS_COMPARISON = process.env.PERF_COMPARISON === "1";

export const BUILD_NAMES: BuildName[] = IS_COMPARISON
  ? ["base", "current"]
  : ["current"];

/** `npm run perf` passes --rounds to the journeys in PERF_ROUNDS. */
export const ROUND_COUNT = parseRoundCount(
  process.env.PERF_ROUNDS,
  IS_COMPARISON,
);

export function parseRoundCount(
  rounds: string | undefined,
  isComparison: boolean,
): number {
  if (rounds === undefined) {
    return isComparison ? COMPARISON_ROUND_COUNT : XRAY_ROUND_COUNT;
  }

  if (!/^[1-9]\d*$/.test(rounds)) {
    throw new Error(`Rounds must be a whole number above 0, not ${rounds}.`);
  }

  // An even number of rounds lets each build go first equally often.
  if (isComparison && Number(rounds) % 2 !== 0) {
    throw new Error(
      `A comparison needs an even number of rounds, not ${rounds}.`,
    );
  }

  return Number(rounds);
}
