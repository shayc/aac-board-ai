export interface Interval {
  low: number;
  high: number;
}

export function median(values: number[]): number {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = (sorted.length - 1) / 2;
  const lower = sorted[Math.floor(middle)] ?? Number.NaN;
  const upper = sorted[Math.ceil(middle)] ?? Number.NaN;

  return (lower + upper) / 2;
}

/**
 * Two-sided exact Wilcoxon signed-rank test of paired differences. Zero
 * differences are left out and tied sizes share their average rank. The p-value
 * counts every way of assigning signs to the observed ranks, so it stays exact
 * with ties and with few samples.
 */
export function signedRankP(differences: number[]): number {
  const changed = differences.filter((difference) => difference !== 0);
  if (changed.length === 0) {
    return 1;
  }

  // Average ranks can end in .5, so ranks are doubled to index by integers.
  const doubledRanks = rank(changed.map(Math.abs)).map((value) => value * 2);
  const doubledTotal = doubledRanks.reduce((total, value) => total + value, 0);
  const doubledPositiveSum = doubledRanks
    .filter((_, index) => (changed[index] ?? 0) > 0)
    .reduce((total, value) => total + value, 0);

  const distance = Math.abs(2 * doubledPositiveSum - doubledTotal);

  return rankSumDistribution(doubledRanks).reduce(
    (p, probability, doubledSum) =>
      Math.abs(2 * doubledSum - doubledTotal) >= distance ? p + probability : p,
    0,
  );
}

/**
 * The Hodges–Lehmann estimate of a typical paired difference: the median of
 * the averages of every pair of differences.
 */
export function typicalDifference(differences: number[]): number {
  return median(pairAverages(differences));
}

/**
 * The confidence interval that goes with the signed-rank test: the differences
 * the test would not reject. Undefined when there are too few samples for any
 * interval to reach the confidence level.
 */
export function differenceInterval(
  differences: number[],
  confidence: number,
): Interval | undefined {
  const averages = pairAverages(differences).toSorted((a, b) => a - b);
  const ranks = differences.map((_, index) => index + 1);
  const tail = (1 - confidence) / 2;

  let excluded = 0;
  let cumulative = 0;
  for (const probability of rankSumDistribution(ranks)) {
    cumulative += probability;
    if (cumulative > tail) {
      break;
    }
    excluded += 1;
  }

  const low = averages[excluded - 1];
  const high = averages[averages.length - excluded];

  return low === undefined || high === undefined ? undefined : { low, high };
}

/**
 * Holm's correction for testing several metrics at once. Comparing the
 * adjusted p-values with a significance level keeps the chance of flagging
 * anything at all, when nothing changed, below that level.
 */
export function holmAdjust(pValues: number[]): number[] {
  const ascending = pValues
    .map((p, index) => ({ p, index }))
    .toSorted((a, b) => a.p - b.p);
  const adjusted = Array.from({ length: pValues.length }, () => 1);

  let largest = 0;
  ascending.forEach(({ p, index }, position) => {
    largest = Math.max(largest, Math.min(1, p * (pValues.length - position)));
    adjusted[index] = largest;
  });

  return adjusted;
}

/** The smallest p the signed-rank test can report for this many samples. */
export function smallestSignedRankP(sampleCount: number): number {
  return 2 / 2 ** sampleCount;
}

function rank(values: number[]): number[] {
  const order = values
    .map((value, index) => ({ value, index }))
    .toSorted((a, b) => a.value - b.value);
  const ranks = Array.from({ length: values.length }, () => 0);

  for (let start = 0; start < order.length;) {
    let end = start;
    while (order[end + 1]?.value === order[start]?.value) {
      end += 1;
    }

    const averageRank = (start + end) / 2 + 1;
    for (let position = start; position <= end; position += 1) {
      ranks[order[position]?.index ?? 0] = averageRank;
    }

    start = end + 1;
  }

  return ranks;
}

/**
 * The probability of each sum of the positive ranks when every rank is
 * positive or negative with equal chance, indexed by that sum.
 */
function rankSumDistribution(integerRanks: number[]): number[] {
  let distribution = [1];

  for (const integerRank of integerRanks) {
    const next = Array.from(
      { length: distribution.length + integerRank },
      () => 0,
    );
    distribution.forEach((probability, sum) => {
      next[sum] = (next[sum] ?? 0) + probability / 2;
      next[sum + integerRank] =
        (next[sum + integerRank] ?? 0) + probability / 2;
    });
    distribution = next;
  }

  return distribution;
}

function pairAverages(values: number[]): number[] {
  return values.flatMap((first, index) =>
    values.slice(index).map((second) => (first + second) / 2),
  );
}
