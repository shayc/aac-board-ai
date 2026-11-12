import type { Unit } from "./budgets.ts";
import type { Comparison, TimingComparison } from "./comparison.ts";
import { RESULTS_FILE, XRAY_FILE } from "./paths.ts";
import type {
  BuildInfo,
  RunResults,
  RunSettings,
  XrayResults,
} from "./results.ts";
import {
  countOverBudget,
  type Scorecard,
  type ScorecardRow,
} from "./scorecard.ts";

export function printScorecard(xray: XrayResults): void {
  console.log(`\nPerf x-ray: ${formatCounts(xray.counts)}\n`);
  for (const row of xray.rows) {
    console.log(`  ${formatRow(row)}`);
  }

  if (xray.counts.watch > 0) {
    console.log(
      "\nwatch: samples fell on both sides of the budget. Rerun on an idle machine to settle it.",
    );
  }

  console.log(`\n${formatBuild(xray.build)}`);
  console.log(formatSettings(xray.settings));
  console.log(`Samples: ${XRAY_FILE}`);
}

export function printComparison(
  results: RunResults,
  comparison: Comparison,
): void {
  const { builds, settings } = results;

  console.log(`\nBase:    ${formatBuild(builds.base)}`);
  console.log(`Current: ${formatBuild(builds.current)}`);
  console.log(formatSettings(settings));

  for (const { journey } of results.journeys) {
    console.log(`\n${journey}`);
    for (const timing of comparison.timings) {
      if (timing.journey === journey) {
        console.log(`  ${formatTiming(timing)}`);
      }
    }
  }

  if (builds.base.buildHash === builds.current.buildHash) {
    console.log(
      "\nBoth builds are identical, so any flag is a false positive.",
    );
  }
  if (!comparison.canFlagChanges) {
    console.log(
      `\n${settings.roundCount} rounds are too few to flag a change in ${comparison.timings.length} timings; this run only shows that the journeys work.`,
    );
  }

  console.log(`\nSamples: ${RESULTS_FILE}`);
}

function formatCounts(counts: Scorecard["counts"]): string {
  if (counts.over === 0 && counts.watch === 0) {
    return `all ${counts.ok} ok`;
  }

  return [
    counts.over > 0 ? `${counts.over} over` : "",
    counts.watch > 0 ? `${counts.watch} watch` : "",
    `${counts.ok} ok`,
  ]
    .filter(Boolean)
    .join(", ");
}

function formatRow(row: ScorecardRow): string {
  const columns = [
    row.state.padEnd(5),
    row.label.padEnd(22),
    formatValue(row.median, row.unit).padStart(8),
    `budget ${formatValue(row.budget, row.unit)}`,
  ];
  const spread =
    row.state === "watch"
      ? `  (${countOverBudget(row)} of ${row.samples.length} samples over)`
      : "";

  return `${columns.join("  ")}${spread}`;
}

function formatValue(value: number, unit: Unit): string {
  if (unit === "ms" && value >= 1000) {
    return `${(value / 1000).toFixed(1)} s`;
  }

  return `${unit === "kB" ? value.toFixed(0) : formatMs(value)} ${unit}`;
}

function formatBuild({ source, commit, buildHash }: BuildInfo): string {
  return `${source} (commit ${commit}, build ${buildHash})`;
}

function formatSettings(settings: RunSettings): string {
  return `Chromium ${settings.browserVersion}, CPU ${settings.cpuSlowdown}× slowdown, ${settings.roundCount} rounds`;
}

function formatTiming(timing: TimingComparison): string {
  const { medians, difference, differenceInterval: interval } = timing;
  const range = interval
    ? `${formatSigned(interval.low)} to ${formatSigned(interval.high)}`
    : "no interval";
  const columns = [
    timing.timing.padEnd(28),
    `${formatMs(medians.base)} → ${formatMs(medians.current)} ms`.padEnd(20),
    `${formatSigned(difference)} ms (${formatSigned(timing.differencePercent)}%)`.padEnd(
      22,
    ),
    `[${range}]`.padEnd(20),
    `p=${timing.p.toPrecision(2)}`,
  ];
  const flag = timing.verdict === "unchanged" ? "" : `  ← ${timing.verdict}`;

  return `${columns.join("  ")}${flag}`;
}

function formatMs(value: number): string {
  return Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(1);
}

function formatSigned(value: number): string {
  return `${value > 0 ? "+" : ""}${formatMs(value)}`;
}
