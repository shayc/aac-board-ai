# Performance lab

A local harness that runs real user journeys against the production build and
writes a report that compares them with a saved baseline. It runs on your
machine only: no telemetry, uploads, accounts or hosted dashboards.

- [Run it](#run-it)
- [Journeys](#journeys)
- [Read the report](#read-the-report)
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
npm run perf -- --profile tileInteraction
```

Runs one journey once, without timing samples, and writes a Chrome trace plus
heap snapshots before and after each measured phase to
`perf-results/profiles/<journey>/`. It prints the functions that took the most
main-thread time in each phase, by source file and line, and the report lists
them next to links to the files. Journeys: `startup`, `tileInteraction`,
`largeImport`.

```bash
npm run perf -- --samples 3
```

Takes 3 samples per journey instead of 10, for a quick check that the journeys
still run. The report warns that the sample count differs from the baseline,
and the run never updates the noise floor.

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

| Journey           | Phase            | What happens                                                                                                                                                                                           |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `startup`         | `firstLaunch`    | Empty storage → onboarding → tap Continue → Quick Core 24 grid.                                                                                                                                        |
|                   | `returnVisit`    | Same context once the service worker controls the page and IndexedDB holds the board set: open `/` in a new page → grid.                                                                               |
| `tileInteraction` | `taps`           | Tap I, want, to (checking the message bar after each), open the linked “eat” board, tap drink, go back.                                                                                                |
|                   | `navigationLoop` | Open “eat” and go back 10 times; JS heap, DOM nodes and listeners are read after forced garbage collection before and after the loop.                                                                  |
| `largeImport`     | `import`         | Import a generated board set (80 boards, 6,400 tiles, 400 small PNGs) through the file chooser, wait for it in the library, open it → its grid. The OBZ is rebuilt on every run with the same content. |

The journeys live in [perf/journeys.spec.ts](../perf/journeys.spec.ts). The
harness that measures them is [perf/harness.ts](../perf/harness.ts); the part
that runs inside the page is [perf/page-perf.ts](../perf/page-perf.ts).

## Read the report

The header warns when a setting differs from the baseline, since a change may
then not be the code. The status also lists metrics the baseline has but this
run did not measure: save a new baseline if one was renamed or removed on
purpose. The memory warning appears only when a metric grew in significantly
more samples than it shrank. Rows whose samples are all zero in both runs are
hidden.

In each row's sample strip, the baseline is on top and this run below. Each
sample comes from a fresh browser context; a metric measured several times in
one sample, such as word taps, contributes that sample's median.

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

"The same build" means the same hash of `dist/`, leaving out source maps, which
change with comments even when the code does not. Vite fingerprints its output,
so identical source produces an identical hash. Each same-build run can only
raise the floor, because a single pair of runs often understates the noise. A
same-build run whose settings or machine speed differ from the baseline leaves
the floor alone. Saving a baseline whose browser, CPU slowdown, sample count,
viewport, OS or CPU differ from the previous baseline clears the floor, so
measure it again after updating the browser or moving to another machine.

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

- The app is built with Vite's `build()` and `sourcemap: "hidden"`, skipping
  the typecheck in `npm run build`: the app's chunks are byte-identical to
  `npm run build`, and the `.map` files sit next to them in
  `dist/` without being referenced or precached. The harness reads them to
  name source files; the service worker and Workbox runtime only gain a source
  map comment. Chrome DevTools does not apply these maps to the traces.
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
- No sleeps: the harness waits for real conditions (elements, service worker
  control, and Event Timing and paint entries, which reach the page a few
  frames after the paint they describe). A watched element that is not
  visible within 15 seconds fails the journey with its selector, and an
  interval with no start or end fails it with the metric name.
- LCP is recorded only for phases without a tap, because the browser stops
  reporting it at the first input, so first launch has FCP but no LCP.
- `speechSynthesis` is stubbed in the page to end on a microtask, mirroring
  [stub-speech.ts](../src/shared/testing/stub-speech.ts), which depends on
  Vitest. Built-in AI is unavailable in this Chromium.
- Host resolution fails for every host except 127.0.0.1, so any other request
  fails and is counted.
- The app code has no performance marks; everything is observed from outside
  through browser APIs and the Chrome DevTools Protocol.

`npm run test:perf` runs the unit tests for the statistics and the verdicts
with Node's built-in test runner.

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
