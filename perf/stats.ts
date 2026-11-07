export interface Spread {
  count: number;
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
}

export function median(values: number[]): number {
  return quantile(
    values.toSorted((a, b) => a - b),
    0.5,
  );
}

export function spreadOf(values: number[]): Spread {
  const sorted = values.toSorted((a, b) => a - b);

  return {
    count: sorted.length,
    median: quantile(sorted, 0.5),
    p25: quantile(sorted, 0.25),
    p75: quantile(sorted, 0.75),
    min: sorted[0] ?? Number.NaN,
    max: sorted.at(-1) ?? Number.NaN,
  };
}

function quantile(sorted: number[], fraction: number): number {
  if (sorted.length === 0) {
    return Number.NaN;
  }

  const position = (sorted.length - 1) * fraction;
  const lower = sorted[Math.floor(position)] ?? Number.NaN;
  const upper = sorted[Math.ceil(position)] ?? Number.NaN;

  return lower + (upper - lower) * (position - Math.floor(position));
}

/**
 * Two-sided Mann–Whitney U test using the normal approximation with tie and
 * continuity corrections. Event Timing rounds to 8 ms, so ties are common.
 */
export function mannWhitneyP(baseline: number[], current: number[]): number {
  const baselineCount = baseline.length;
  const currentCount = current.length;
  if (baselineCount === 0 || currentCount === 0) {
    return Number.NaN;
  }

  const { ranks, tieCorrection } = rank([...baseline, ...current]);
  const baselineRankSum = ranks
    .slice(0, baselineCount)
    .reduce((total, value) => total + value, 0);
  const u = baselineRankSum - (baselineCount * (baselineCount + 1)) / 2;

  const total = baselineCount + currentCount;
  const variance =
    ((baselineCount * currentCount) / 12) *
    (total + 1 - tieCorrection / (total * (total - 1)));
  if (variance <= 0) {
    return 1;
  }

  const distance = Math.abs(u - (baselineCount * currentCount) / 2) - 0.5;
  const z = Math.max(distance, 0) / Math.sqrt(variance);

  return Math.min(1, 2 * (1 - normalCDF(z)));
}

function rank(values: number[]): { ranks: number[]; tieCorrection: number } {
  const order = values
    .map((value, index) => ({ value, index }))
    .toSorted((a, b) => a.value - b.value);
  const ranks = Array.from({ length: values.length }, () => 0);
  let tieCorrection = 0;

  for (let start = 0; start < order.length;) {
    let end = start;
    while (order[end + 1]?.value === order[start]?.value) {
      end += 1;
    }

    const tieSize = end - start + 1;
    const averageRank = (start + end) / 2 + 1;
    for (let position = start; position <= end; position += 1) {
      ranks[order[position]?.index ?? 0] = averageRank;
    }

    tieCorrection += tieSize ** 3 - tieSize;
    start = end + 1;
  }

  return { ranks, tieCorrection };
}

/**
 * One-sided sign test: how likely at least this many samples grow if growth
 * and shrinkage were equally likely. Samples with no change are left out.
 */
export function growthSignP(growths: number[]): number {
  const grew = growths.filter((growth) => growth > 0).length;
  const changed = growths.filter((growth) => growth !== 0).length;

  let probability = 0;
  for (let count = grew; count <= changed; count += 1) {
    probability += binomial(changed, count) / 2 ** changed;
  }

  return probability;
}

function binomial(total: number, chosen: number): number {
  let result = 1;
  for (let step = 1; step <= chosen; step += 1) {
    result = (result * (total - chosen + step)) / step;
  }

  return result;
}

// Abramowitz & Stegun 7.1.26; accurate to about 1e-7, far below what a
// 0.05 significance cut needs.
function normalCDF(z: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const polynomial =
    t *
    (0.254829592 +
      t *
        (-0.284496736 +
          t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - polynomial * Math.exp(-((z / Math.SQRT2) ** 2));

  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}
