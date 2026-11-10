import {
  CONFIDENCE_LEVEL,
  SIGNIFICANCE_LEVEL,
  type Comparison,
  type MemoryGrowth,
  type MetricComparison,
} from "./comparison.ts";
import type {
  BuildInfo,
  MetricKind,
  MetricUnit,
  ProfileListing,
  RunMeta,
  RunResults,
} from "./results.ts";

export interface ReportInput {
  results: RunResults;
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
${renderStatus(comparison, meta)}
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
<p class="muted">Chromium with simulated CPU slowdown on this machine. These numbers compare two builds; they do not predict speed on a real tablet. See docs/performance.md.</p>
</main>
</body>
</html>
`;
}

function describeRun(meta: RunMeta): string {
  return [
    meta.date,
    `Chromium ${meta.browserVersion}`,
    `CPU ${meta.cpuThrottleRate}× slowdown`,
    `${meta.sampleCount} samples per build`,
    meta.viewport,
    meta.os,
    meta.cpu,
  ].join(" · ");
}

function describeBuild({ source, commit, buildHash }: BuildInfo): string {
  return `${source} (commit ${commit}, build ${buildHash})`;
}

function renderStatus(comparison: Comparison, { builds }: RunMeta): string {
  const tested = comparison.metrics.filter(({ test }) => test !== undefined);
  const regressions = tested.filter(
    ({ test }) => test?.verdict === "regression",
  );
  const improvements = tested.filter(
    ({ test }) => test?.verdict === "improvement",
  );
  const percent = (fraction: number) => `${Math.round(fraction * 100)}%`;

  return `<p>Base: ${escapeHTML(describeBuild(builds.base))}<br>Current: ${escapeHTML(describeBuild(builds.current))}</p>
<p><strong>${regressions.length} regressions, ${improvements.length} improvements</strong> in ${tested.length} timings. Each round ran both builds back to back. A timing is flagged when its per-round differences are significant (exact Wilcoxon signed-rank test, Holm-adjusted p &lt; ${SIGNIFICANCE_LEVEL}), so two builds that perform alike get any flag at all in fewer than ${percent(SIGNIFICANCE_LEVEL)} of runs. Differences show the typical per-round difference with its ${percent(CONFIDENCE_LEVEL)} confidence interval.</p>
${builds.base.buildHash === builds.current.buildHash ? `<p class="note">Both builds are identical, so any flag below is a false positive.</p>` : ""}
${comparison.canFlagChanges ? "" : `<p class="warning">Too few samples to flag a change in ${tested.length} timings. This run only shows that the journeys work.</p>`}
${regressions.length > 0 ? renderTable(regressions, true) : ""}`;
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

  return `<div class="warning"><strong>Memory grows with repeated use in the current build</strong><ul>${items.join("")}</ul>Profile the journey and compare the before and after heap snapshots.</div>`;
}

function isAlwaysZero({ samples }: MetricComparison): boolean {
  return [...samples.base, ...samples.current].every((value) => value === 0);
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
  const isTested = rows.some(({ test }) => test !== undefined);
  const body = rows.map((row) => {
    const name = showJourney ? `${row.journey} › ${row.metric}` : row.metric;
    const { base, current } = row.spreads;

    return `<tr class="${row.test?.verdict ?? ""}">
<th scope="row"><span>${escapeHTML(name)}</span><small>${escapeHTML(row.description)}</small></th>
<td>${formatValue(base.median, row.unit)}</td>
<td><strong>${formatValue(current.median, row.unit)}</strong><small>${formatValue(current.p25, row.unit)}–${formatValue(current.p75, row.unit)}</small></td>
<td>${renderDifference(row)}</td>
<td>${renderStrip(row)}</td>
${row.test ? `<td>${row.test.p.toPrecision(2)}</td><td>${row.test.verdict}</td>` : ""}
</tr>`;
  });

  return `<div class="table"><table>
<thead><tr><th scope="col">Metric</th><th scope="col">Base median</th><th scope="col">Current median (p25–p75)</th><th scope="col">Difference</th><th scope="col">Samples</th>${isTested ? `<th scope="col">Adjusted p</th><th scope="col">Verdict</th>` : ""}</tr></thead>
<tbody>${body.join("")}</tbody>
</table></div>`;
}

function renderDifference(row: MetricComparison): string {
  const { difference, differenceInterval: interval, unit } = row;
  const range = interval
    ? `${formatSigned(interval.low, unit)} to ${formatSigned(interval.high, unit)}`
    : "too few samples for an interval";

  return `${formatSigned(difference, unit)} ${formatPercent(row.differencePercent)}<small>${range}</small>`;
}

// Base samples on the top row, the current build's on the bottom row, both on
// one shared scale from the smallest to the largest sample.
function renderStrip({ samples }: MetricComparison): string {
  const values = [...samples.base, ...samples.current];
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

  return `<svg class="strip" viewBox="0 0 120 20" width="120" height="20" aria-hidden="true">${dots(samples.base, 6, "base")}${dots(samples.current, 14, "current")}</svg>`;
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
    profile.buildHash === meta.builds.current.buildHash
      ? ""
      : `<p class="warning">This profile is from build ${escapeHTML(profile.buildHash)}, not the current build measured above.</p>`;

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

/** A one-line difference for the terminal summary. */
export function formatDifference(row: MetricComparison): string {
  return `${formatSigned(row.difference, row.unit)} ${formatPercent(row.differencePercent)}`;
}

function formatSigned(value: number, unit: MetricUnit): string {
  return `${value > 0 ? "+" : ""}${formatValue(value, unit)}`;
}

function formatPercent(percent: number): string {
  if (!Number.isFinite(percent)) {
    return "(from 0)";
  }

  return `(${percent > 0 ? "+" : ""}${percent.toFixed(1)}%)`;
}

function escapeHTML(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const STYLES = `
:root { color-scheme: light dark; --text: #1d2327; --muted: #5c666e; --line: #d9dee2; --surface: #ffffff; --page: #f5f7f8; --bad: #b3261e; --bad-bg: #fbe9e7; --good: #1e6b3a; --good-bg: #e6f4ea; --dot-base: #9aa5ad; --dot-current: #00696d; }
@media (prefers-color-scheme: dark) { :root { --text: #e3e7ea; --muted: #a3adb4; --line: #3a4248; --surface: #1d2226; --page: #121618; --bad: #ffb4ab; --bad-bg: #3d1b18; --good: #8fd6a4; --good-bg: #16301f; --dot-base: #6b767e; --dot-current: #6fd8d8; } }
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
.note, .warning { margin: 12px 0; padding: 10px 14px; border-radius: 8px; background: var(--surface); border: 1px solid var(--line); }
.warning { border-color: var(--bad); }
.table { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--line); }
th, td { padding: 6px 10px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
td { white-space: nowrap; font-variant-numeric: tabular-nums; }
thead th { font-size: 12px; color: var(--muted); }
tr.regression td:last-child { color: var(--bad); background: var(--bad-bg); font-weight: 600; }
tr.improvement td:last-child { color: var(--good); background: var(--good-bg); font-weight: 600; }
.strip circle.base { fill: var(--dot-base); }
.strip circle.current { fill: var(--dot-current); }
ol, ul { margin: 4px 0; padding-inline-start: 22px; }
`;
