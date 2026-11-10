export const ACTION_TIMEOUT_MS = 15_000;
export const BASE_BUILD_URL = "http://127.0.0.1:4174";

const DEFAULT_ROUND_COUNT = 10;

/** `npm run perf` passes --rounds to the journeys in PERF_ROUNDS. */
export const ROUND_COUNT = parseRoundCount(process.env.PERF_ROUNDS);

export function parseRoundCount(rounds: string | undefined): number {
  if (rounds === undefined) {
    return DEFAULT_ROUND_COUNT;
  }

  // An even number of rounds lets each build go first equally often.
  if (!/^[1-9]\d*$/.test(rounds) || Number(rounds) % 2 !== 0) {
    throw new Error(`Rounds must be an even number above 0, not ${rounds}.`);
  }

  return Number(rounds);
}
