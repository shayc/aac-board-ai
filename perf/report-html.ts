import type {
  FlowReport,
  Headline,
  Hotspot,
  Rating,
  Report,
  Row,
  Stat,
  Threshold,
} from "./analyze.ts";

const RATING_LABELS: Record<Rating, string> = {
  good: "Good",
  "needs-improvement": "Needs improvement",
  poor: "Poor",
  none: "Not measured",
};

const KIND_LABELS: Record<Hotspot["kind"], string> = {
  function: "Function",
  frame: "Long frame script",
  component: "Component",
  request: "Request",
};

const BREAKDOWN_PARTS = [
  ["network", "Network"],
  ["scripting", "Scripting"],
  ["rendering", "Rendering"],
  ["idle", "Idle / waiting"],
] as const;

function escapeHTML(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatMs(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) {
    return "–";
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} s`;
  }

  return value < 10 ? `${value.toFixed(1)} ms` : `${Math.round(value)} ms`;
}

function formatBytes(value: number): string {
  return value >= 1024 * 1024
    ? `${(value / 1024 / 1024).toFixed(2)} MB`
    : `${(value / 1024).toFixed(1)} KB`;
}

function formatValue(
  value: number | undefined,
  unit: Headline["unit"],
): string {
  if (value === undefined || Number.isNaN(value)) {
    return "–";
  }
  if (unit === "bytes") {
    return formatBytes(value);
  }

  return unit === "score" ? value.toFixed(3) : formatMs(value);
}

function formatStat(
  value: Stat | undefined,
  format: (value: number) => string = formatMs,
): string {
  if (!value || Number.isNaN(value.median)) {
    return "–";
  }

  return `${format(value.median)} <span class="iqr">IQR ${format(value.iqr)}</span>`;
}

function formatBudget(budget: Threshold, unit: Headline["unit"]): string {
  return `good ≤ ${formatValue(budget.good, unit)} · poor > ${formatValue(budget.poor, unit)}`;
}

function statusPill(rating: Rating): string {
  return `<span class="status ${rating}"><span class="dot" aria-hidden="true"></span>${RATING_LABELS[rating]}</span>`;
}

function renderHeadline(headline: Headline): string {
  return `
    <li class="card ${headline.rating}">
      <h3>${escapeHTML(headline.label)}</h3>
      <p class="value">${formatValue(headline.value, headline.unit)}</p>
      ${statusPill(headline.rating)}
      <p class="budget">${formatBudget(headline.budget, headline.unit)}</p>
      <p class="detail">${escapeHTML(headline.detail)}</p>
    </li>`;
}

function renderHotspot(hotspot: Hotspot): string {
  return `
    <li>
      <div class="hotspot-main">
        <p class="hotspot-name"><span class="kind">${KIND_LABELS[hotspot.kind]}</span> <code>${escapeHTML(hotspot.name)}</code></p>
        <p class="cause">${escapeHTML(hotspot.cause)}</p>
        <p class="where"><code>${escapeHTML(hotspot.location)}</code></p>
        <p class="affects">Affects: ${escapeHTML(hotspot.flows.join(", ") || "–")} · <a href="${escapeHTML(hotspot.trace)}">representative trace</a></p>
      </div>
      <p class="score">${formatMs(hotspot.score)}<span>${hotspot.kind === "request" ? "wall time" : "main thread"}</span></p>
    </li>`;
}

function renderBreakdown(flow: FlowReport): string {
  const total =
    BREAKDOWN_PARTS.reduce((sum, [key]) => sum + flow.breakdown[key], 0) || 1;
  const segments = BREAKDOWN_PARTS.map(([key, label]) => {
    const value = flow.breakdown[key];
    const width = (value / total) * 100;
    return width > 0
      ? `<span class="segment ${key}" style="width:${width.toFixed(2)}%" title="${label}: ${formatMs(value)}"></span>`
      : "";
  }).join("");
  const legend = BREAKDOWN_PARTS.map(
    ([key, label]) =>
      `<span><span class="swatch ${key}" aria-hidden="true"></span>${label} ${formatMs(flow.breakdown[key])}</span>`,
  ).join("");

  return `<div class="bar" aria-hidden="true">${segments}</div><p class="parts">${legend}</p>`;
}

function renderFlowMetrics(flow: FlowReport): string {
  const metrics: [string, string][] = [];
  if (flow.kind === "load") {
    metrics.push(
      ["TTFB", formatStat(flow.ttfb)],
      ["FCP", formatStat(flow.fcp)],
      ["LCP", formatStat(flow.lcp)],
    );
    metrics.push(["CLS", formatStat(flow.cls, (value) => value.toFixed(3))]);
  } else {
    metrics.push(["INP", formatStat(flow.inp)]);
    if (flow.routeLCP) {
      metrics.push(["Route LCP", formatStat(flow.routeLCP)]);
    }
  }
  metrics.push(
    ["React commits", `${flow.commits.median}`],
    [
      "Commits / interaction",
      flow.kind === "load" ? "–" : flow.commitsPerInteraction.toFixed(1),
    ],
    ["Long frames", `${flow.longFrames.median}`],
  );

  const detail = flow.inpDetail
    ? `<p class="inp-detail">Slowest interaction: ${escapeHTML(flow.inpDetail.type)} on <code>${escapeHTML(flow.inpDetail.target)}</code> — input delay ${formatMs(flow.inpDetail.inputDelay)}, processing ${formatMs(flow.inpDetail.processing)}, presentation ${formatMs(flow.inpDetail.presentation)}</p>`
    : "";
  const lcpTarget = flow.lcpTarget
    ? `<p class="inp-detail">LCP element: <code>${escapeHTML(flow.lcpTarget)}</code></p>`
    : "";

  return `<dl class="metrics">${metrics
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("")}</dl>${detail}${lcpTarget}`;
}

function renderFlow(flow: FlowReport): string {
  return `
    <li class="flow">
      <div class="flow-head">
        <h3>${escapeHTML(flow.title)}</h3>
        <p class="flow-span"><code>${escapeHTML(flow.span)}</code> · ${flow.kind === "load" ? "navigation start → painted board" : "input → painted result"}</p>
        <p class="flow-value">${formatStat(flow.duration)} ${statusPill(flow.rating)}</p>
      </div>
      ${renderBreakdown(flow)}
      ${renderFlowMetrics(flow)}
      <p class="links"><a href="${escapeHTML(flow.representativeRun)}/trace.json.gz">Median-run trace</a> · <a href="${escapeHTML(flow.representativeRun)}/cpu.cpuprofile">CPU profile</a> · <a href="${escapeHTML(flow.representativeRun)}/metrics.json">metrics</a></p>
    </li>`;
}

function renderTable(
  id: string,
  title: string,
  rows: Row[],
  note = "",
): string {
  if (rows.length === 0) {
    return `<section class="table-section" aria-labelledby="${id}"><h3 id="${id}">${title}</h3><p>No data.</p></section>`;
  }

  const columns = Object.keys(rows[0]);
  const head = columns
    .map(
      (column) =>
        `<th scope="col"><button type="button">${escapeHTML(column)}</button></th>`,
    )
    .join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => {
            const value = row[column];
            const isNumber = typeof value === "number";
            return `<td${isNumber ? ` class="num" data-value="${value}"` : ""}>${escapeHTML(isNumber ? value.toLocaleString("en-US", { maximumFractionDigits: 1 }) : value)}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("");

  return `
    <section class="table-section" aria-labelledby="${id}">
      <h3 id="${id}">${title}</h3>
      ${note ? `<p class="note">${note}</p>` : ""}
      <div class="table-wrap" tabindex="0" role="region" aria-labelledby="${id}">
        <table class="sortable">
          <thead><tr>${head}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>`;
}

function renderVariation(report: Report): string {
  const { withinRun, previous } = report.variation;
  const within = `Within this run, the median flow's IQR is ${(withinRun * 100).toFixed(1)}% of its median.`;
  const between = previous
    ? ` Against the previous result ${escapeHTML(previous.label)}, flow medians moved by ${(previous.median * 100).toFixed(1)}% (median) and at most ${(previous.max * 100).toFixed(1)}% (${escapeHTML(previous.maxFlow)}).`
    : " No earlier result to compare with yet; run again to measure run-to-run variation.";

  return within + between;
}

function renderRunInfo(report: Report): string {
  const { meta } = report;
  const { network, viewport } = meta.settings;
  const rows: [string, string][] = [
    ["Date", meta.date.replace("T", " ").slice(0, 19) + " UTC"],
    ["Commit", meta.commit],
    ["Browser", meta.browser],
    ["Node", meta.node],
    ["CPU throttling", `${meta.settings.cpuSlowdown}× slowdown`],
    [
      "Network throttling",
      `${network.latencyMs} ms latency, ${network.downloadKbps / 1024} Mbps down, ${network.uploadKbps / 1024} Mbps up`,
    ],
    [
      "Viewport",
      `${viewport.width}×${viewport.height}, ${meta.settings.locale}, ${meta.settings.timezone}`,
    ],
    [
      "Runs",
      `${meta.runs} measured per flow after ${meta.settings.warmups} discarded warm-ups`,
    ],
    ["Run-to-run variation", renderVariation(report)],
    [
      "Build",
      "Production build with VITE_PERF=true and React's profiling build; bundle sizes come from the regular production build",
    ],
  ];

  return `<dl class="run-info">${rows
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("")}</dl>`;
}

const STYLES = `
:root {
  color-scheme: light dark;
  --bg: #f7f8fa; --surface: #ffffff; --text: #1b1f24; --muted: #59636e; --border: #d8dee4;
  --good: #1a7f37; --warn: #9a6700; --poor: #cf222e; --none: #6e7781;
  --network: #2f81f7; --scripting: #d4a72c; --rendering: #8250df; --idle: #c9d1d9;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif; line-height: 1.45;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #0d1117; --surface: #161b22; --text: #e6edf3; --muted: #9198a1; --border: #30363d;
    --good: #3fb950; --warn: #d29922; --poor: #f85149; --none: #8b949e; --idle: #3d444d; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text); }
header, main { max-width: 1180px; margin: 0 auto; padding: 0 16px; }
header { padding-top: 24px; }
h1 { margin: 0 0 4px; font-size: 1.6rem; }
h2 { margin: 40px 0 12px; font-size: 1.25rem; }
h3 { margin: 0; font-size: 1rem; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85em; overflow-wrap: anywhere; }
a { color: var(--network); }
.meta, .note, .budget, .detail, .flow-span, .where, .affects, .parts, .inp-detail, .links, .iqr { color: var(--muted); }
.iqr { font-size: 0.8em; font-weight: normal; }
nav ul { display: flex; flex-wrap: wrap; gap: 16px; padding: 0; list-style: none; margin: 12px 0 0; }
.scorecard { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; padding: 0; list-style: none; margin: 0; }
.card { background: var(--surface); border: 1px solid var(--border); border-top: 4px solid var(--none); border-radius: 8px; padding: 12px 14px; }
.card.good { border-top-color: var(--good); } .card.needs-improvement { border-top-color: var(--warn); } .card.poor { border-top-color: var(--poor); }
.card p { margin: 4px 0 0; }
.card .value { font-size: 1.7rem; font-weight: 650; font-variant-numeric: tabular-nums; }
.budget, .detail { font-size: 0.8rem; }
.status { display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; }
.status .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--none); }
.status.good { color: var(--good); } .status.good .dot { background: var(--good); }
.status.needs-improvement { color: var(--warn); } .status.needs-improvement .dot { background: var(--warn); }
.status.poor { color: var(--poor); } .status.poor .dot { background: var(--poor); }
.hotspots { padding: 0; margin: 0; list-style: none; counter-reset: hotspot; }
.hotspots li { counter-increment: hotspot; display: flex; gap: 16px; justify-content: space-between; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 14px; margin-bottom: 8px; }
.hotspots li::before { content: counter(hotspot); font-weight: 700; font-size: 1.1rem; min-width: 1.5em; color: var(--muted); }
.hotspot-main { flex: 1; min-width: 0; }
.hotspot-main p { margin: 2px 0; }
.hotspot-name { font-weight: 600; }
.kind { display: inline-block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; border: 1px solid var(--border); border-radius: 4px; padding: 0 6px; margin-inline-end: 6px; color: var(--muted); }
.score { margin: 0; text-align: end; font-size: 1.2rem; font-weight: 650; font-variant-numeric: tabular-nums; white-space: nowrap; }
.score span { display: block; font-size: 0.75rem; font-weight: normal; color: var(--muted); }
.flows { padding: 0; margin: 0; list-style: none; }
.flow { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 10px; }
.flow-head { display: grid; grid-template-columns: 1fr auto; gap: 2px 16px; align-items: baseline; }
.flow-head p { margin: 0; }
.flow-span { grid-column: 1; font-size: 0.85rem; }
.flow-value { grid-column: 2; grid-row: 1 / span 2; text-align: end; font-size: 1.15rem; font-weight: 650; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
.bar { display: flex; height: 14px; border-radius: 4px; overflow: hidden; margin: 12px 0 6px; background: var(--idle); }
.segment, .swatch { background: var(--idle); }
.network { background: var(--network); } .scripting { background: var(--scripting); } .rendering { background: var(--rendering); } .idle { background: var(--idle); }
.swatch { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-inline-end: 4px; vertical-align: -1px; }
.parts { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 0; font-size: 0.82rem; }
.metrics { display: flex; flex-wrap: wrap; gap: 6px 24px; margin: 10px 0 0; }
.metrics dt { font-size: 0.75rem; color: var(--muted); }
.metrics dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }
.inp-detail, .links { margin: 8px 0 0; font-size: 0.85rem; }
.table-section { margin-bottom: 28px; }
.table-section h3 { margin-bottom: 8px; }
.table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; max-height: 520px; }
table { border-collapse: collapse; width: 100%; font-size: 0.85rem; }
th, td { padding: 6px 10px; border-bottom: 1px solid var(--border); text-align: start; vertical-align: top; }
td.num { text-align: end; font-variant-numeric: tabular-nums; white-space: nowrap; }
thead th { position: sticky; top: 0; background: var(--surface); z-index: 1; }
th button { all: unset; cursor: pointer; font-weight: 600; }
th button:focus-visible { outline: 2px solid var(--network); outline-offset: 2px; }
th[aria-sort="ascending"] button::after { content: " ▲"; } th[aria-sort="descending"] button::after { content: " ▼"; }
.run-info { display: grid; grid-template-columns: max-content 1fr; gap: 6px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
.run-info div { display: contents; } .run-info dt { color: var(--muted); } .run-info dd { margin: 0; }
footer { max-width: 1180px; margin: 32px auto; padding: 0 16px; color: var(--muted); font-size: 0.85rem; }
@media (max-width: 640px) { .hotspots li { flex-direction: column; } .score { text-align: start; } .run-info { grid-template-columns: 1fr; } .flow-head { grid-template-columns: 1fr; } .flow-value { grid-column: 1; grid-row: auto; align-items: flex-start; text-align: start; } }
`;

const SORT_SCRIPT = `
for (const table of document.querySelectorAll("table.sortable")) {
  const headers = Array.from(table.tHead.rows[0].cells);
  headers.forEach((header, index) => {
    header.querySelector("button").addEventListener("click", () => {
      const ascending = header.getAttribute("aria-sort") !== "ascending";
      headers.forEach((other) => other.removeAttribute("aria-sort"));
      header.setAttribute("aria-sort", ascending ? "ascending" : "descending");
      const body = table.tBodies[0];
      const key = (row) => {
        const cell = row.cells[index];
        return cell.dataset.value !== undefined ? Number(cell.dataset.value) : cell.textContent;
      };
      const rows = Array.from(body.rows).sort((a, b) => {
        const [x, y] = [key(a), key(b)];
        const order = typeof x === "number" ? x - y : String(x).localeCompare(String(y));
        return ascending ? order : -order;
      });
      body.append(...rows);
    });
  });
}
`;

export function renderReport(report: Report): string {
  const { meta, tables } = report;
  const { network } = meta.settings;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Performance report – ${escapeHTML(meta.commit)}</title>
<style>${STYLES}</style>
</head>
<body>
<header>
  <h1>Performance report</h1>
  <p class="meta">${escapeHTML(meta.commit)} · ${escapeHTML(meta.date.slice(0, 16).replace("T", " "))} UTC · ${escapeHTML(meta.browser)} · CPU ${meta.settings.cpuSlowdown}× · ${network.downloadKbps / 1024} Mbps / ${network.latencyMs} ms · ${meta.runs} runs per flow · medians with IQR</p>
  <nav aria-label="Report sections"><ul>
    <li><a href="#summary">Summary</a></li><li><a href="#hotspots">Hotspots</a></li><li><a href="#flows">Flows</a></li><li><a href="#details">Details</a></li><li><a href="#run-info">Run info</a></li>
  </ul></nav>
</header>
<main>
  <section aria-labelledby="summary"><h2 id="summary">Summary</h2>
    <ul class="scorecard">${report.headlines.map(renderHeadline).join("")}</ul>
    <p class="note">Budgets live in <code>perf-budgets.json</code>. Google's thresholds are field (p75) targets; these are lab medians, so treat ratings as a guide. ${renderVariation(report)}</p>
  </section>
  <section aria-labelledby="hotspots"><h2 id="hotspots">Top ${report.hotspots.length} hotspots</h2>
    <p class="note">Ranked by main-thread time summed over each flow's median run (requests by wall time). Functions use self time from CPU profiles; components use React Profiler time excluding nested profiled components; long-frame scripts come from the Long Animation Frames API. Open traces in Chrome DevTools → Performance → Load profile.</p>
    <ol class="hotspots">${report.hotspots.map(renderHotspot).join("")}</ol>
  </section>
  <section aria-labelledby="flows"><h2 id="flows">Flows and route changes</h2>
    <p class="note">Each bar runs from the input event to the paint of the result, split by the renderer main thread: network (idle while requests are in flight), scripting, rendering (style, layout, paint) and idle or waiting (for example IndexedDB).</p>
    <ul class="flows">${report.flows.map(renderFlow).join("")}</ul>
  </section>
  <section aria-labelledby="details"><h2 id="details">Details</h2>
    ${renderTable("table-functions", "Functions (CPU profile, within the flow span)", tables.functions, "Self time excludes callees; total includes them. Native functions are attributed to their nearest script caller.")}
    ${renderTable("table-components", "Components (React Profiler)", tables.components)}
    ${renderTable("table-operations", "Named operations (measure())", tables.operations)}
    ${renderTable("table-interactions", "Interactions (Event Timing)", tables.interactions)}
    ${renderTable("table-frames", "Long animation frame scripts", tables.frames)}
    ${renderTable("table-requests", "Requests (Resource Timing)", tables.requests)}
    ${renderTable("table-bundles", "Bundles (production build)", tables.bundles, "No route-level code splitting: every route loads the initial chunks; in-app route changes load no JS or CSS (see Requests). Styles are CSS-in-JS, so there are no CSS files.")}
  </section>
  <section aria-labelledby="run-info"><h2 id="run-info">Run info</h2>${renderRunInfo(report)}</section>
</main>
<footer>Generated by <code>npm run perf</code>. Regenerate with <code>npm run perf:report -- &lt;result dir&gt;</code>.</footer>
<script>${SORT_SCRIPT}</script>
</body>
</html>
`;
}
