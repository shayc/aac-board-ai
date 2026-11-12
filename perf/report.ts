import type { Unit } from "./budgets.ts";
import type { Comparison, TimingComparison } from "./comparison.ts";
import { RESULTS_FILE, XRAY_FILE } from "./paths.ts";
import type {
  BuildInfo,
  RunResults,
  RunSettings,
  XrayResults,
} from "./results.ts";
import type { Scorecard, ScorecardRow } from "./scorecard.ts";

const MS_PER_SECOND = 1000;

export function formatScorecard(xray: XrayResults): string {
  const lines = [
    "",
    `Perf x-ray: ${formatCounts(xray.counts)}`,
    "",
    ...xray.rows.map((row) => `  ${formatRow(row)}`),
  ];

  if (xray.counts.watch > 0) {
    lines.push(
      "",
      "watch: samples fell on both sides of the budget. Rerun on an idle machine to settle it.",
    );
  }

  lines.push(
    "",
    formatBuild(xray.build),
    formatSettings(xray.settings),
    `Samples: ${XRAY_FILE}`,
  );

  return lines.join("\n");
}

export function formatComparison(
  results: RunResults,
  comparison: Comparison,
): string {
  const { builds, settings } = results;
  const lines = [
    "",
    `Base:    ${formatBuild(builds.base)}`,
    `Current: ${formatBuild(builds.current)}`,
    formatSettings(settings),
  ];

  for (const { journey } of results.journeys) {
    lines.push("", journey);
    for (const timing of comparison.timings) {
      if (timing.journey === journey) {
        lines.push(`  ${formatTiming(timing)}`);
      }
    }
  }

  if (builds.base.buildHash === builds.current.buildHash) {
    lines.push(
      "",
      "Both builds are identical, so any flag is a false positive.",
    );
  }
  if (!comparison.canFlagChanges) {
    lines.push(
      "",
      `${settings.roundCount} rounds are too few to flag a change in ${comparison.timings.length} timings; this run only shows that the journeys work.`,
    );
  }

  lines.push("", `Samples: ${RESULTS_FILE}`);

  return lines.join("\n");
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
      ? `  (${row.overCount} of ${row.samples.length} samples over)`
      : "";

  return `${columns.join("  ")}${spread}`;
}

function formatValue(value: number, unit: Unit): string {
  if (unit === "kB") {
    return `${value.toFixed(0)} kB`;
  }

  // Round before choosing the unit, so 999.6 ms reads as 1.0 s, not 1000 ms.
  return Math.round(value) >= MS_PER_SECOND
    ? `${(value / MS_PER_SECOND).toFixed(1)} s`
    : `${formatMs(value)} ms`;
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
