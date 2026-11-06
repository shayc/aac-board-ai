# Performance lab

A local harness that runs real user journeys against the production build and
writes a report that compares them with a saved baseline. It runs on your
machine only: no telemetry, uploads, accounts or hosted dashboards.

- [Run it](#run-it)
- [Journeys](#journeys)
- [Read the report](#read-the-report)
- [What each number means](#what-each-number-means)
- [How runs are compared](#how-runs-are-compared)
- [Find out why](#find-out-why)
- [Method](#method)
- [Limits](#limits)

## Run it

```bash
npm run perf
```

Builds the app, runs every journey, writes `perf-results/results.json` and
`perf-results/report.html`, compares with the baseline if there is one, prints a
summary and opens the report. A full run takes about 3 minutes; keep the
machine otherwise idle while it runs.

```bash
npm run perf -- --save-baseline
```

Does the same, then saves the run as the baseline that later runs compare
against.

```bash
npm run perf -- --profile tile-interaction
```

Runs one journey once, without timing samples, and writes a Chrome trace plus
heap snapshots before and after each measured phase to
`perf-results/profiles/<journey>/`. The report links to them. Journeys:
`startup`, `tile-interaction`, `large-import`.

A typical loop:

1. On `main`, run `npm run perf -- --save-baseline`.
2. Run `npm run perf` again, twice, without changing anything. Because the
   build is identical, the harness records each run's difference from the
   baseline in the noise floor (`perf-results/noise-floor.json`), keeping the
   largest difference per metric.
3. Make your change and run `npm run perf`.
4. If something regressed, run `npm run perf -- --profile <journey>` and open
   the trace.

Everything under `perf-results/` is generated and gitignored, including the
baseline.

## Journeys

Every journey uses the bundled Quick Core 24 board set (except large import)
and asserts what the user would see, so a broken journey fails the run instead
of reporting fast numbers.

| Journey            | Phase            | What happens                                                                                                                                                                                           |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `startup`          | `firstLaunch`    | Empty storage → onboarding → tap Continue → Quick Core 24 grid.                                                                                                                                        |
|                    | `returnVisit`    | Same context once the service worker controls the page and IndexedDB holds the board set: open `/` in a new page → grid.                                                                               |
| `tile-interaction` | `taps`           | Tap I, want, to (checking the message bar after each), open the linked “eat” board, tap drink, go back.                                                                                                |
|                    | `navigationLoop` | Open “eat” and go back 10 times; JS heap, DOM nodes and listeners are read after forced garbage collection before and after the loop.                                                                  |
| `large-import`     | `import`         | Import a generated board set (80 boards, 6,400 tiles, 400 small PNGs) through the file chooser, wait for it in the library, open it → its grid. The OBZ is generated on each run with identical bytes. |

The journeys live in [perf/journeys.spec.ts](../perf/journeys.spec.ts). The
harness that measures them is [perf/harness.ts](../perf/harness.ts).

## Read the report

- **Header**: commit, build hash, browser, CPU slowdown, sample count,
  viewport, OS and CPU. A warning lists any setting that differs from the
  baseline; when settings differ, a change may not be the code.
- **Status**: how many metrics regressed or improved against the baseline, and
  whether the noise floor has been measured.
- **Memory grows with repeated use**: shown only when a memory metric grew in
  significantly more samples than it shrank.
- **Timings, slowest first**: every timing across journeys, which answers
  which flow is slow.
- **One section per journey**: timings, CPU, long animation frames, network and
  memory, then the scripts that ran in long frames and the latest profile.

Every row shows the baseline median, this run's median with its 25th–75th
percentile range, the change, the Mann–Whitney p-value and a strip of the
individual samples (baseline on top, this run below). Each sample comes from a
fresh browser context; a metric measured several times in one sample, such as
word taps, contributes that sample's median.

## What each number means

**Taps** (`wordTap`, `openBoardTap`, `backTap`) come from the Event Timing API:
the time from the hardware input timestamp to the next frame being presented,
covering input delay, event processing and rendering. Chromium rounds them to
8 ms and reports nothing under 16 ms, so a tap under 16 ms is recorded as 16 ms.
These are per-tap latencies, not INP; INP is one high-percentile value over a
whole page visit.

**“→ grid” and “→ onboarding” timings** start at the tap's input timestamp, or
at navigation start for page loads. They end right after the main thread has
painted the first frame in which the element is laid out and not hidden from
assistive technology (`aria-hidden` or `inert`). The harness checks for the
element in `requestAnimationFrame` and timestamps a user-blocking task posted
from there, which runs after that frame's paint and ahead of other queued
work. While the onboarding dialog is open, the grid behind it is hidden from
assistive technology, so `continueToGrid` includes the dialog closing.

**FCP and LCP** are the browser's paint timings for the page load. On first
launch Chromium reports no LCP before the Continue tap, so that row is absent.

**CPU** rows are deltas of Chrome DevTools Protocol `Performance.getMetrics`
over the phase: `task` is all main-thread task time, and `script`, `layout`
and `style` are its JavaScript, layout and style-recalculation parts. They are
measured under the CPU slowdown.

**Long animation frames** count frames over 50 ms and sum their blocking
duration. The script list attributes their script time to file · function ·
invoker. Files are production chunks; the chunk names follow the
code-splitting groups in [vite.config.ts](../vite.config.ts) (`react`, `mui`,
`shayc` and `vendor` are dependencies, `index` is app code). Function names
are minified.

**Network** counts HTTP requests from the page and its service worker (board
symbols load from `blob:` URLs and are not counted), failed requests, and
bytes the page downloaded according to Resource Timing. Bytes exclude the
service worker's precaching, and responses served by the service worker count
as zero. Request timings are not reported: on localhost they are close to zero
and mean nothing.

**Memory** rows are growth over the navigation loop, read after forced garbage
collection: `heapGrowth` is the JS heap used (not total process memory),
`nodeGrowth` is DOM nodes and `listenerGrowth` is JS event listeners. The
report flags growth when it appears in significantly more samples than not
(one-sided sign test, p < 0.05). The JS heap includes compiled code, which
grows while the JIT warms up, so DOM node and listener counts are the sharper
leak signal.

## How runs are compared

For each metric, the harness compares the baseline samples with this run's
samples using a two-sided Mann–Whitney U test (normal approximation with tie
and continuity corrections; it matches SciPy's asymptotic method). A change is
flagged as a regression or improvement only when all of these hold:

- p < 0.05;
- the median changed by more than that metric's noise floor, measured by
  running the same build twice, or by 10% before the noise floor exists, and
  by at least 5% either way, because runs of one build drifted by up to 6%
  with p < 0.001 on a laptop;
- the median changed by at least 8 ms, one request or count, or 1 kB, so
  Event Timing rounding alone never counts.

A significant change that fails either size check is labeled “within noise”.

"The same build" means the same hash of `dist/`. Vite fingerprints its output,
so identical source produces an identical hash. Each same-build run can only
raise the floor, because a single pair of runs often understates the noise.
Delete `perf-results/noise-floor.json` and measure again after updating the
browser or moving to another machine.

## Find out why

1. In the report, find the journey and phase that regressed, and check whether
   CPU script, layout or style time moved with it.
2. Read the scripts in long animation frames to see which chunk and invoker
   grew.
3. Run `npm run perf -- --profile <journey>`. Load
   `<phase>.trace.json` in Chrome DevTools → Performance. Each measured
   interval appears in the Timings track under its metric name, so you can
   check that it covers the operation you expect.
4. For memory growth, load `navigationLoop.before.heapsnapshot` and
   `navigationLoop.after.heapsnapshot` in DevTools → Memory and use the
   Comparison view.

Profile runs trace and snapshot the heap, which slows the page, so they never
contribute timing samples.

## Method

- The production build is served with `vite preview` on 127.0.0.1:4173,
  reusing the `webServer` from [playwright.config.ts](../playwright.config.ts).
  [perf/playwright.config.ts](../perf/playwright.config.ts) extends it, so
  `npm run test:pwa` never runs the journeys.
- Browser: Playwright's bundled Chromium in new headless mode
  (`channel: "chromium"`), Desktop Chrome device settings (1280×720), en-US.
- The CPU is slowed 4× with `Emulation.setCPUThrottlingRate`.
- One journey at a time, one worker, a fresh browser context per sample, one
  discarded warm-up sample, then 10 samples. The report shows medians and
  spread, never a single sample.
- No sleeps: the harness waits for real conditions (elements, Event Timing
  entries, service worker control).
- `speechSynthesis` is stubbed in the page to end on a microtask, mirroring
  [stub-speech.ts](../src/shared/testing/stub-speech.ts), which depends on
  Vitest. Built-in AI is unavailable in this Chromium.
- Host resolution fails for every host except 127.0.0.1, so any other request
  fails and is counted.
- The app code has no performance marks; everything is observed from outside
  through browser APIs and the Chrome DevTools Protocol.

[perf/run.ts](../perf/run.ts) orchestrates a run,
[perf/compare.ts](../perf/compare.ts) and [perf/stats.ts](../perf/stats.ts)
compare runs, [perf/report.ts](../perf/report.ts) renders the static report and
[perf/large-board-set.ts](../perf/large-board-set.ts) generates the import
fixture.

## Limits

- Numbers come from Chromium on the developer's machine with a simulated CPU
  slowdown. They catch regressions against a baseline; they do not predict
  speed on a real iPad or Android tablet.
- CPU throttling slows the page's main thread. It does not slow the GPU,
  compositor, network or IndexedDB work that happens outside the page's main
  thread, so I/O-heavy flows look faster than on a slow device.
- Headless rendering differs from a headed browser with a GPU.
- Baselines are only comparable on the same machine, browser build and
  settings. The report warns when they differ.
- Other load on the machine shows up as noise. Close heavy apps before
  measuring.
- Not covered: WebKit/Safari, built-in AI, real speech, remote media, CI.
