# Performance

`npm run perf` builds the app with instrumentation, drives its main flows in
Chromium with Playwright, and opens an HTML report of medians, budgets and
hotspots. Nothing here ships in the regular production build.

## Run it

```bash
npm ci
npx playwright install chromium
npm run perf
```

Options: `npm run perf -- --flows=add-tile,open-folder --runs=5 --no-open`.
The default is 10 measured runs per flow after 2 discarded warm-ups.

Each run writes `perf-results/<date>-<commit>/` (git-ignored):

| Path                        | Contents                                                            |
| --------------------------- | ------------------------------------------------------------------- |
| `report.html`               | Self-contained report; open it in any browser                       |
| `runs/<flow>/<nn>/`         | `metrics.json`, `cpu.cpuprofile` and `trace.json.gz` for each run   |
| `meta.json`, `bundles.json` | Run settings, browser, commit, production bundle sizes              |
| `summary.json`              | Flow medians, used to state run-to-run variation in the next report |
| `build/`                    | The instrumented build with source maps, used to map code locations |

`npm run perf:report -- perf-results/<dir>` regenerates a report from saved
data. Load a trace or CPU profile in Chrome DevTools → Performance → Load
profile.

## Read the report

1. **Summary** — LCP, worst route-change LCP, INP, CLS, slowest flow and
   initial JS, each with its budget and a good / needs improvement / poor
   rating. Budgets live in [`perf-budgets.json`](../perf-budgets.json): LCP,
   INP and CLS use Google's "good" and "poor" thresholds, which are field (p75)
   targets, so lab medians are a guide only. Flow budgets are this project's
   choice; the JS budget guards against growth from the 350 KB gzip measured in
   November 2026.
2. **Top 10 hotspots** — functions (CPU-profile self time), long animation
   frame scripts, React components (Profiler time excluding nested profiled
   components) and requests, ranked by time summed over each flow's median.
   Each names a source location (through source maps), the flows it affects, a
   likely cause and a trace from the run closest to the median.
3. **Flows and route changes** — each flow from input (or navigation start)
   to the painted result, split into network, scripting, rendering and idle or
   waiting time on the main thread, with INP and its breakdown.
4. **Details** — sortable tables of functions, components, `measure()`
   operations, interactions, long-frame scripts, requests and bundles.
5. **Run info** — date, commit, browser, throttling, runs, and run-to-run
   variation against the previous result.

Every metric is the median with its interquartile range (IQR) across runs.

## How it measures

- **Lab setup:** production build with `VITE_PERF=true`, React aliased to its
  profiling build, 4× CPU slowdown, 40 ms latency with 10 Mbps down and 5 Mbps
  up, a 1280×800 viewport, `en-US` in UTC, and service workers blocked. Flows
  prepare state unthrottled, then measure throttled. Speech output and the
  voice list are stubbed and built-in AI is turned off; the app has no backend,
  and its only data download is the bundled starter board.
- **Rounds:** each round runs every flow once, so a slow stretch on the host
  costs every flow a run or two instead of shifting one flow's median.
- **Spans** end at paint: `requestAnimationFrame`, then `setTimeout(0)` after
  the commit that shows the result. Loads and route changes also report
  browser paint times through LCP and soft-navigation LCP.
- **CPU profiles** come from the trace, limited to the span. Samples inside
  the instrumentation itself are excluded, but those milliseconds still count
  in span durations. Under CPU throttling, the throttler's pauses show up as
  `(program)` and are not attributed to functions.
- **React's Performance-panel tracks are off:** the runner removes
  `console.timeStamp`, which React's profiling build logs every component
  render to. While tracing, that logging took over half of a tile press.
  `<Profiler>` timings are unaffected.

## Instrument code

The module is [`src/perf/`](../src/perf/). Names follow `area:feature:action`
and live in [`perf-names.ts`](../src/perf/perf-names.ts); add a name there
first.

- `usePerfSpan(name, result)` returns `{ start }`. Call `start()` in the input
  handler; the span ends at the paint after the first commit in which `result`
  changes. Omit `result` when one component starts a flow and another shows its
  result.
- `measure(name, fn)` times a known-expensive operation, sync or async, and
  aggregates count, total and max in memory. It returns `fn`'s value, error or
  the same promise unchanged. Find other hot functions in CPU profiles instead
  of wrapping code.
- `<PerfProfiler id="Name">` wraps a subtree in React's `<Profiler>`.

Without `VITE_PERF=true` the helpers are no-ops and the collector, observers
and web-vitals are tree-shaken; only the no-op call sites remain. The module
records names, durations, sizes, route patterns and element structure, never
board content, labels or IDs.

## Add a flow

Add one file to [`perf/flows/`](../perf/flows/); the runner picks it up by file
name.

```ts
import { defineFlow } from "../flow.ts";

export default defineFlow({
  title: "Open settings",
  span: "flow:settings:open",
  kind: "interaction",
  setup: async ({ page }) => {
    // Optional, unthrottled: reach the state the flow starts from.
  },
  run: (app) =>
    app.press(app.page.getByRole("button", { name: "Open settings" })),
});
```

`kind: "load"` flows navigate in `run` and measure from navigation start.
`isolateRuns` gives each run a fresh browser context, for flows that change
stored data. Use `app.press` for the measured input: it scrolls the target
into view, waits until it is stable and dispatches a plain mouse click.
Playwright's `click()` is fine in `setup`. In `run`, avoid
`click({ trial: true })`: its check dispatches real pointer events, which
show up as extra interactions. If a flow never records its span, the runner stops after 60
seconds and saves `perf-results/failure.png`.
