import {
  DEFAULT_NOISE_FLOOR_PERCENT,
  MIN_MEANINGFUL_CHANGE,
  MIN_NOISE_FLOOR_PERCENT,
  SIGNIFICANCE_LEVEL,
  type Comparison,
  type MemoryGrowth,
  type MetricComparison,
  type MissingMetric,
} from "./comparison.ts";
import type {
  MetricKind,
  MetricUnit,
  NoiseFloor,
  ProfileListing,
  RunMeta,
  RunResults,
} from "./results.ts";

export interface ReportInput {
  results: RunResults;
  baselineMeta: RunMeta | undefined;
  noiseFloor: NoiseFloor | undefined;
  comparison: Comparison;
  profiles: ProfileListing[];
}

const KIND_TITLES: Record<MetricKind, string> = {
  timing: "Timings",
  cpu: "CPU (main thread)",
  frames: "Long animation frames",
  network: "Network",
  memory: "Memory (JS heap after forced GC)",
};

export function renderReport({
  results,
  baselineMeta,
  noiseFloor,
  comparison,
  profiles,
}: ReportInput): string {
  const { meta } = results;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Performance report</title>
<style>${STYLES}</style>
</head>
<body>
<main>
<h1>Performance report</h1>
<p class="muted">${escapeHTML(describeRun(meta))}</p>
${renderStatus(comparison, baselineMeta, noiseFloor)}
${renderMemoryGrowth(comparison.memory)}
${results.journeys
  .map(({ journey }) =>
    renderJourney(
      journey,
      comparison.metrics.filter(
        (metric) => metric.journey === journey && !isAlwaysZero(metric),
      ),
      profiles.find((profile) => profile.journey === journey),
      meta,
    ),
  )
  .join("\n")}
<p class="muted">Chromium with simulated CPU slowdown on this machine. These numbers catch regressions against a baseline; they do not predict speed on a real tablet. See docs/performance.md.</p>
</main>
</body>
</html>
`;
}

function describeRun(meta: RunMeta): string {
  return [
    `commit ${meta.commit}${meta.isDirty ? " (uncommitted changes)" : ""}`,
    `build ${meta.buildHash}`,
    meta.date,
    `Chromium ${meta.browserVersion}`,
    `CPU ${meta.cpuThrottleRate}× slowdown`,
    `CPU benchmark ${meta.cpuBenchmarkMs.toFixed(1)} ms`,
    `${meta.sampleCount} samples`,
    meta.viewport,
    meta.os,
    meta.cpu,
  ].join(" · ");
}

function renderStatus(
  comparison: Comparison,
  baselineMeta: RunMeta | undefined,
  noiseFloor: NoiseFloor | undefined,
): string {
  if (!baselineMeta) {
    return `<p class="note">No baseline yet. Save this run with <code>npm run perf -- --save-baseline</code>, then compare later runs against it.</p>`;
  }

  const regressions = comparison.metrics.filter(
    ({ verdict }) => verdict === "regression",
  );
  const improvements = comparison.metrics.filter(
    ({ verdict }) => verdict === "improvement",
  );
  const noiseFloorText = noiseFloor
    ? `Noise floor: the largest change per metric across ${noiseFloor.comparisonCount} same-build comparisons, latest ${noiseFloor.latestDate}.`
    : `Noise floor not measured yet, so changes must exceed ${DEFAULT_NOISE_FLOOR_PERCENT}%. Run the same build twice to measure it.`;
  const settingWarnings = comparison.settingDifferences.map(
    ({ setting, baseline, current }) =>
      `<li>${escapeHTML(setting)}: baseline ${escapeHTML(baseline)}, now ${escapeHTML(current)}</li>`,
  );

  return `<p>Compared with baseline commit ${escapeHTML(baselineMeta.commit)}, build ${escapeHTML(baselineMeta.buildHash)} (${escapeHTML(baselineMeta.date)}): <strong>${regressions.length} regressions, ${improvements.length} improvements.</strong> A change counts when it is significant (Mann–Whitney p &lt; ${SIGNIFICANCE_LEVEL}), larger than the noise floor (and at least ${MIN_NOISE_FLOOR_PERCENT}%), and at least one ${MIN_MEANINGFUL_CHANGE.ms} ms Event Timing step.</p>
<p class="muted">${escapeHTML(noiseFloorText)}</p>
${settingWarnings.length > 0 ? `<div class="warning"><strong>Settings differ from the baseline, so changes may not be the code:</strong><ul>${settingWarnings.join("")}</ul></div>` : ""}
${renderMissingMetrics(comparison.missingMetrics)}
${regressions.length > 0 ? renderTable(regressions, true) : ""}`;
}

function renderMissingMetrics(missingMetrics: MissingMetric[]): string {
  if (missingMetrics.length === 0) {
    return "";
  }

  const items = missingMetrics.map(
    ({ journey, metric }) =>
      `<li>${escapeHTML(journey)} › ${escapeHTML(metric)}</li>`,
  );

  return `<div class="warning"><strong>Measured in the baseline but not in this run:</strong><ul>${items.join("")}</ul>If a metric was renamed or removed on purpose, save a new baseline. Otherwise the journey stopped measuring it.</div>`;
}

function renderMemoryGrowth(memory: MemoryGrowth[]): string {
  const growing = memory.filter(({ isGrowing }) => isGrowing);
  if (growing.length === 0) {
    return "";
  }

  const items = growing.map(
    ({ journey, metric, unit, medianGrowth, grewCount, sampleCount, p }) =>
      `<li>${escapeHTML(journey)} ${escapeHTML(metric)}: median +${formatValue(medianGrowth, unit)}, grew in ${grewCount} of ${sampleCount} samples (sign test p = ${p.toPrecision(2)}).</li>`,
  );

  return `<div class="warning"><strong>Memory grows with repeated use</strong><ul>${items.join("")}</ul>Profile the journey and compare the before and after heap snapshots.</div>`;
}

function isAlwaysZero({
  currentValues,
  baselineValues = [],
}: MetricComparison): boolean {
  return [...currentValues, ...baselineValues].every((value) => value === 0);
}

function renderJourney(
  journey: string,
  metrics: MetricComparison[],
  profile: ProfileListing | undefined,
  meta: RunMeta,
): string {
  const sections = Object.entries(KIND_TITLES)
    .map(([kind, title]) => ({
      title,
      rows: metrics.filter((metric) => metric.kind === kind),
    }))
    .filter(({ rows }) => rows.length > 0)
    .map(({ title, rows }) => `<h3>${title}</h3>\n${renderTable(rows, false)}`);

  return `<section>
<h2>${escapeHTML(journey)}</h2>
${sections.join("\n")}
${renderProfile(journey, profile, meta)}
</section>`;
}

function renderTable(rows: MetricComparison[], showJourney: boolean): string {
  const body = rows.map((row) => {
    const name = showJourney ? `${row.journey} › ${row.metric}` : row.metric;

    return `<tr class="${row.verdict.replace(" ", "-")}">
<th scope="row"><span>${escapeHTML(name)}</span><small>${escapeHTML(row.description)}</small></th>
<td>${row.baseline ? formatValue(row.baseline.median, row.unit) : "—"}</td>
<td><strong>${formatValue(row.current.median, row.unit)}</strong><small>${formatValue(row.current.p25, row.unit)}–${formatValue(row.current.p75, row.unit)}</small></td>
<td>${formatChange(row)}</td>
<td>${row.p === undefined ? "—" : row.p.toPrecision(2)}</td>
<td>${renderStrip(row)}</td>
<td>${row.verdict}${renderNoiseFloor(row)}</td>
</tr>`;
  });

  return `<div class="table"><table>
<thead><tr><th scope="col">Metric</th><th scope="col">Baseline median</th><th scope="col">Median (p25–p75)</th><th scope="col">Change</th><th scope="col">p</th><th scope="col">Samples</th><th scope="col">Verdict</th></tr></thead>
<tbody>${body.join("")}</tbody>
</table></div>`;
}

function renderNoiseFloor({
  baseline,
  noiseFloorPercent,
  isNoiseFloorMeasured,
}: MetricComparison): string {
  if (!baseline) {
    return "";
  }

  const source = isNoiseFloorMeasured ? "" : ", default";

  return `<small>floor ${noiseFloorPercent.toFixed(1)}%${source}</small>`;
}

// Baseline samples on the top row, this run's on the bottom row, both on one
// shared scale from the smallest to the largest sample.
function renderStrip({
  currentValues,
  baselineValues = [],
}: MetricComparison): string {
  const values = [...baselineValues, ...currentValues];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const toX = (value: number) =>
    max === min ? 60 : 4 + ((value - min) / (max - min)) * 112;
  const dots = (row: number[], y: number, className: string) =>
    row
      .map(
        (value) =>
          `<circle class="${className}" cx="${toX(value).toFixed(1)}" cy="${y}" r="2.5"/>`,
      )
      .join("");

  return `<svg class="strip" viewBox="0 0 120 20" width="120" height="20" aria-hidden="true">${dots(baselineValues, 6, "baseline")}${dots(currentValues, 14, "current")}</svg>`;
}

function renderProfile(
  journey: string,
  profile: ProfileListing | undefined,
  meta: RunMeta,
): string {
  if (!profile) {
    return `<p class="muted">No profile yet: <code>npm run perf -- --profile ${escapeHTML(journey)}</code></p>`;
  }

  const links = profile.files.map(
    (file) =>
      `<li><a href="profiles/${encodeURIComponent(journey)}/${encodeURIComponent(file)}">${escapeHTML(file)}</a></li>`,
  );
  const staleWarning =
    profile.buildHash === meta.buildHash
      ? ""
      : `<p class="warning">This profile is from build ${escapeHTML(profile.buildHash)}, not the build measured above.</p>`;

  return `<h3>Profile</h3>
<p class="muted">Commit ${escapeHTML(profile.commit)}, ${escapeHTML(profile.date)}. Load a <code>.trace.json</code> in Chrome DevTools → Performance; the harness's measured intervals are in the Timings track. Load both <code>.heapsnapshot</code> files in DevTools → Memory and use the Comparison view.</p>
${staleWarning}
<ul>${links.join("")}</ul>
${renderHotFunctions(profile.hotFunctions)}`;
}

function renderHotFunctions(
  hotFunctions: ProfileListing["hotFunctions"],
): string {
  const lists = hotFunctions.map(({ phase, functions }) => {
    const items = functions.map(
      ({ function: name, selfMs }) =>
        `<li><code>${escapeHTML(name)}</code> ${formatValue(selfMs, "ms")}</li>`,
    );

    return `<h4>${escapeHTML(phase)}</h4><ol>${items.join("")}</ol>`;
  });

  return `<h3>Main-thread JavaScript by self time</h3>
<p class="muted">Sampled time per function during the profile, under the CPU slowdown, as source file:line · function. Time in browser APIs such as DOM calls and forced layout counts toward the function that called them.</p>
${lists.join("\n")}`;
}

export function formatValue(value: number, unit: MetricUnit): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  if (unit === "bytes") {
    return formatBytes(value);
  }

  const rounded =
    Math.abs(value) >= 100 ? Math.round(value) : Math.round(value * 10) / 10;

  return unit === "ms" ? `${rounded} ms` : String(rounded);
}

function formatBytes(value: number): string {
  const size = Math.abs(value);
  if (size >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)} MB`;
  }
  if (size >= 1_000) {
    return `${(value / 1_000).toFixed(1)} kB`;
  }

  return `${Math.round(value)} B`;
}

function formatChange({
  change,
  changePercent,
  unit,
}: MetricComparison): string {
  if (change === undefined || changePercent === undefined) {
    return "—";
  }

  const sign = change > 0 ? "+" : "";

  return `${sign}${formatValue(change, unit)}<small>${formatPercent(changePercent)}</small>`;
}

export function formatPercent(changePercent: number): string {
  if (!Number.isFinite(changePercent)) {
    return "from 0";
  }

  return `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`;
}

function escapeHTML(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const STYLES = `
:root { color-scheme: light dark; --text: #1d2327; --muted: #5c666e; --line: #d9dee2; --surface: #ffffff; --page: #f5f7f8; --bad: #b3261e; --bad-bg: #fbe9e7; --good: #1e6b3a; --good-bg: #e6f4ea; --dot-baseline: #9aa5ad; --dot-current: #00696d; }
@media (prefers-color-scheme: dark) { :root { --text: #e3e7ea; --muted: #a3adb4; --line: #3a4248; --surface: #1d2226; --page: #121618; --bad: #ffb4ab; --bad-bg: #3d1b18; --good: #8fd6a4; --good-bg: #16301f; --dot-baseline: #6b767e; --dot-current: #6fd8d8; } }
* { box-sizing: border-box; }
body { margin: 0; color: var(--text); background: var(--page); font: 15px/1.5 system-ui, sans-serif; }
main { max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; }
h1 { margin: 0 0 4px; font-size: 26px; }
h2 { margin: 36px 0 8px; font-size: 20px; }
h3 { margin: 20px 0 6px; font-size: 16px; }
h4 { margin: 12px 0 4px; font-size: 14px; }
.muted, small { color: var(--muted); }
small { display: block; font-size: 12px; font-weight: normal; }
code { font: 13px ui-monospace, monospace; overflow-wrap: anywhere; }
.note, .warning { padding: 10px 14px; border-radius: 8px; background: var(--surface); border: 1px solid var(--line); }
.warning { border-color: var(--bad); }
.table { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--line); }
th, td { padding: 6px 10px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
td { white-space: nowrap; font-variant-numeric: tabular-nums; }
thead th { font-size: 12px; color: var(--muted); }
tr.regression td:last-child { color: var(--bad); background: var(--bad-bg); font-weight: 600; }
tr.improvement td:last-child { color: var(--good); background: var(--good-bg); font-weight: 600; }
.strip circle.baseline { fill: var(--dot-baseline); }
.strip circle.current { fill: var(--dot-current); }
ol, ul { margin: 4px 0; padding-inline-start: 22px; }
`;
