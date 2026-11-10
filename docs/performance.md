# Performance lab

A local harness that runs real user journeys against two production builds,
the working tree and a git ref, and writes a report of how they differ. It runs
on your machine only: no telemetry, uploads, accounts or hosted dashboards.

- [Run it](#run-it)
- [Journeys](#journeys)
- [Read the report](#read-the-report)
- [How builds are compared](#how-builds-are-compared)
- [Find out why](#find-out-why)
- [Method](#method)
- [Limits](#limits)

## Run it

```bash
npm run perf
```

Builds the working tree and `main`, runs every journey on both, writes
`perf-results/results.json` and `perf-results/report.html`, prints a summary
and opens the report. Keep the machine otherwise idle while it runs.

```bash
npm run perf -- --base HEAD~3
```

Compares with another commit, branch or tag instead of `main`.

The base ref is checked out into a temporary git worktree, gets its own
`npm ci`, and is built there. That takes a few minutes the first time; the
build is kept in `perf-results/base/` and reused until the ref points at
another commit.

```bash
npm run perf -- --profile tileInteraction
```

Runs one journey once on the working tree's build, without timing samples, and
writes a Chrome trace plus heap snapshots before and after each measured phase
to `perf-results/profiles/<journey>/`. It prints the functions that took the
most main-thread time in each phase, by source file and line, and the report
lists them next to links to the files. Journeys: `startup`, `tileInteraction`,
`largeImport`.

```bash
npm run perf -- --samples 3
```

Takes 3 samples per build instead of 10, for a quick check that the journeys
still run. That is too few to flag a change, and the report says so.

Everything under `perf-results/` is generated and gitignored.

## Journeys

Every journey asserts what the user would see, so a broken journey fails the
run instead of reporting fast numbers.

| Journey           | Phase            | What happens                                                                                                                                                                                           |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `startup`         | `firstLaunch`    | Empty storage → onboarding → tap Continue → First Words grid.                                                                                                                                          |
|                   | `returnVisit`    | Same context once the service worker controls the page and IndexedDB holds the board set: open `/` in a new page → grid.                                                                               |
| `tileInteraction` | `taps`           | On Quick Core 60, downloaded from the library beforehand: tap I, want, to (checking the message bar after each), open the linked “eat” board, tap drink, go back.                                      |
|                   | `navigationLoop` | Open “eat” and go back 10 times; JS heap, DOM nodes and listeners are read after forced garbage collection before and after the loop.                                                                  |
| `largeImport`     | `import`         | Import a generated board set (80 boards, 6,400 tiles, 400 small PNGs) through the file chooser, wait for it in the library, open it → its grid. The OBZ is rebuilt on every run with the same content. |

The journeys live in [perf/journeys.spec.ts](../perf/journeys.spec.ts). The
harness that measures them is [perf/harness.ts](../perf/harness.ts); the part
that runs inside the page is [perf/page-perf.ts](../perf/page-perf.ts).

The same journeys drive both builds, so they have to work on both. If a change
renames a button a journey taps, the run fails on the base build; compare
against a ref that already has the new name.

## Read the report

The header names both builds. Timings come first in each journey and are the
only metrics with a verdict; CPU, long-frame, network and memory rows help
explain a timing that moved. The memory warning appears only when a metric
grew in significantly more samples than it shrank in the current build. Rows
whose samples are all zero in both builds are hidden.

In each row's sample strip, the base build is on top and the current build
below. Each sample comes from a fresh browser context; a metric measured
several times in one sample, such as word taps, contributes that sample's
median.

The difference column is the typical per-round difference (the Hodges–Lehmann
estimate) with its 95% confidence interval underneath. It is not the difference
between the two medians, although the two are usually close.

## How builds are compared

A run is a series of rounds. Each round runs a journey once on each build, back
to back, and the builds take turns going first. Whatever the machine is doing
during a round (other load, heat, power state) slows both samples alike, so the
difference within a round is the builds' difference. Nothing is compared across
time: there is no saved baseline, and a slow afternoon cannot look like a
regression.

For each timing, the harness takes the per-round differences and tests them
with a two-sided exact Wilcoxon signed-rank test. The p-values are then
adjusted with Holm's method for the number of timings. A timing is flagged as a
regression or an improvement when its adjusted p is below 0.05; the size of the
change is for you to judge from the difference and its interval.

The correction is what makes a flag trustworthy: when two builds perform
alike, a run flags anything at all less than 5% of the time. When both builds
are byte-identical the report says so, which makes `--base HEAD` on a clean
tree a check of the lab itself.

With 10 samples the smallest possible p is 0.002, enough to flag a change
among up to 25 timings. With fewer samples, or many more timings, nothing can
be flagged, and the report warns about it.

## Find out why

1. In the report, find the journey and phase that regressed, and check whether
   CPU script, layout or style time moved with it.
2. Run `npm run perf -- --profile <journey>`. The terminal and the report's
   “Main-thread JavaScript by self time” list name the functions that took the
   most time in each phase, by source file and line, so open the top `src/`
   file first. Self time is sampled time in the function itself; time in
   browser APIs it calls, such as DOM methods or a forced layout, counts toward
   it, while style, layout, paint and garbage collection outside JavaScript do
   not. For the full picture, load `<phase>.trace.json` in Chrome DevTools →
   Performance. Each measured interval appears in the Timings track under its
   metric name, so you can check that it covers the operation you expect.
3. For memory growth, load `navigationLoop.before.heapsnapshot` and
   `navigationLoop.after.heapsnapshot` in DevTools → Memory and use the
   Comparison view.

Profile runs trace and snapshot the heap, which slows the page, so they never
contribute timing samples.

## Method

- Both builds come from `vite build --sourcemap hidden`, skipping the
  typecheck in `npm run build`: the app's chunks are byte-identical to
  `npm run build`, and the `.map` files sit next to them without being
  referenced or precached. The harness reads them to name source files; the
  service worker and Workbox runtime only gain a source map comment. Chrome
  DevTools does not apply these maps to the traces.
- Each build is served with `vite preview` on its own 127.0.0.1 port: the
  working tree's on 4173, reusing the `webServer` from
  [playwright.config.ts](../playwright.config.ts), and the base ref's on 4174.
  [perf/playwright.config.ts](../perf/playwright.config.ts) extends that
  config, so `npm run test:pwa` never runs the journeys.
- Browser: Playwright's bundled Chromium in new headless mode
  (`channel: "chromium"`), Desktop Chrome device settings (1280×720), en-US.
- The CPU is slowed 4× with `Emulation.setCPUThrottlingRate` during the
  measured phases. Setup between them, such as downloading a board set, runs
  at full speed.
- One journey at a time, one worker, a fresh browser context per sample, one
  discarded warm-up sample per build, then 10 rounds. The report shows medians
  and spread, never a single sample.
- A tap is timed from its `pointerdown` to the first rendered frame that shows
  its result, read with `performance.now()`. Nothing is rounded, and a result
  that never appears fails the journey instead of recording a number.
- No sleeps: the harness waits for real conditions (elements, service worker
  control, and paint entries, which reach the page a few frames after the
  paint they describe). A watched element that is not visible within 15
  seconds fails the journey with its selector, and an interval with no start
  or end fails it with the metric name.
- LCP is recorded only for phases without a tap, because the browser stops
  reporting it at the first input, so first launch has FCP but no LCP.
- `speechSynthesis` is stubbed in the page to end on a microtask, mirroring
  [stub-speech.ts](../src/shared/testing/stub-speech.ts), which depends on
  Vitest. Built-in AI is unavailable in this Chromium.
- Host resolution fails for every host except 127.0.0.1, so any other request
  fails and is counted.
- The message bar has no role or accessible name, so the journeys find its
  parts by position: the children of the element before the play button.
- The app code has no performance marks; everything is observed from outside
  through browser APIs and the Chrome DevTools Protocol.

`npm run test:perf` runs the unit tests for the statistics and the verdicts
with Node's built-in test runner.

## Limits

- Numbers come from Chromium on the developer's machine with a simulated CPU
  slowdown. They show how two builds differ; they do not predict speed on a
  real iPad or Android tablet.
- CPU throttling slows the page's main thread. It does not slow the GPU,
  compositor, network or IndexedDB work that happens outside the page's main
  thread, so I/O-heavy flows look faster than on a slow device.
- Headless rendering differs from a headed browser with a GPU.
- A frame counts as rendered when the main thread has finished its style,
  layout and paint. Compositing and display happen after that and are not
  measured.
- Other load on the machine cancels out between the builds but widens the
  confidence intervals, so small changes go unflagged. Close heavy apps before
  measuring.
- A change that renames what a journey taps cannot be compared with a ref
  from before the rename.
- Not covered: WebKit/Safari, built-in AI, real speech, remote media, CI.
