# Performance lab

A local harness that runs user journeys against two production builds, the
working tree and a git ref, and prints how their timings differ. It runs on
your machine only: no telemetry, uploads, accounts or hosted dashboards.

## Run it

```bash
npm run perf
```

Builds the working tree and `main`, runs every journey on both, prints a table
and writes every sample to `perf-results/results.json`. Keep the machine awake
and otherwise idle while it runs.

```bash
npm run perf -- --base HEAD~3
```

Compares with another commit, branch or tag instead of `main`.

```bash
npm run perf -- --rounds 2
```

Runs 2 rounds instead of 10, for a quick check that the journeys still work.
That is too few to flag a change, and the output says so. The number has to be
even, so each build goes first in half the rounds.

The base ref is checked out into a temporary git worktree, gets its own
`npm ci`, and is built there. That takes a few minutes the first time; the
build is kept in `perf-results/base/` and reused until the ref points at
another commit. Delete `perf-results/base/` to rebuild it anyway, for instance
after changing Node versions. Everything under `perf-results/` is generated and
gitignored.

## Journeys

| Journey           | What happens                                                                                             | Timings                                                                        |
| ----------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `startup`         | Empty storage → onboarding → tap Continue → First Words grid. Then a new page once the app is installed. | `firstLaunch.toOnboarding`, `firstLaunch.continueToGrid`, `returnVisit.toGrid` |
| `tileInteraction` | On Quick Core 60: tap I, want, to, open the linked “eat” board, tap drink, go back.                      | `wordTap`, `openBoardToGrid`, `backToGrid`                                     |

Every journey asserts what the user would see, so a broken journey fails the
run instead of reporting fast numbers. The journeys live in
[perf/journeys.spec.ts](../perf/journeys.spec.ts), the harness in
[perf/harness.ts](../perf/harness.ts), and the part that runs inside the page
in [perf/page-perf.ts](../perf/page-perf.ts).

The same journeys drive both builds, so they have to work on both. If a change
renames a button a journey taps, the run fails on the base build; compare
against a ref that already has the new name.

## Read the output

```text
tileInteraction
  wordTap    62.0 → 71.5 ms    +9.4 ms (+15.2%)    [+7.9 to +11.0]    p=0.012  ← regression
```

Each row shows the base and current medians, the typical per-round difference
(the Hodges–Lehmann estimate) with its 95% confidence interval, and the
adjusted p-value. A row is flagged when that p is below 0.05; how much the
change matters is for you to judge from the difference and its interval.

## How builds are compared

A run is a series of rounds. Each round runs a journey once on each build, back
to back, and the builds take turns going first. Whatever the machine is doing
during a round (other load, heat, power state) slows both samples alike, so the
difference within a round is the builds' difference. Nothing is compared across
time: there is no saved baseline, and a slow afternoon cannot look like a
regression.

For each timing, the harness takes the per-round differences and tests them
with a two-sided exact Wilcoxon signed-rank test, then adjusts the p-values
with Holm's method for the number of timings. When two builds perform alike, a
run therefore flags anything at all less than 5% of the time. When both builds
are byte-identical the output says so, which makes `--base HEAD` on a clean
tree a check of the lab itself.

With 10 rounds the smallest possible p is 0.002, enough to flag a change among
up to 25 timings. With fewer rounds nothing can be flagged, and the output
warns about it.

## Method

- Both builds come from `vite build`, skipping the typecheck in
  `npm run build`, and each is served with `vite preview` on its own
  127.0.0.1 port: the working tree's on 4173, reusing the `webServer` from
  [playwright.config.ts](../playwright.config.ts), and the base ref's on 4174.
  [perf/playwright.config.ts](../perf/playwright.config.ts) extends that
  config, so `npm run test:pwa` never runs the journeys, and replaces its
  browser projects with Chromium alone.
- Browser: Playwright's bundled Chromium in new headless mode, Desktop Chrome
  device settings (1280×720), en-US, service worker on.
- A timing runs from its start (navigation, or a tap's `pointerdown`) to the
  first rendered frame that shows its result, read with `performance.now()`. A
  result that does not appear within 15 seconds fails the journey.
- The CPU is slowed 4× with `Emulation.setCPUThrottlingRate` during the timed
  steps. Setup around them, such as downloading a board set, runs at full
  speed.
- One journey at a time, one worker, a fresh browser context per sample, and
  one discarded warm-up sample per build. A timing taken several times in one
  sample, such as word taps, contributes that sample's median.
- `speechSynthesis` is stubbed in the page to end on a microtask, mirroring
  [stub-speech.ts](../src/shared/testing/stub-speech.ts), which depends on
  Vitest. Built-in AI is unavailable in this Chromium.
- Host resolution fails for every host except 127.0.0.1.
- The app code has no performance marks; everything is observed from outside.
  The journeys find the message's parts by position: the children of the
  element before the play button.

`npm run test:perf` runs the unit tests for the statistics and the verdicts
with Node's built-in test runner.

## Limits

- Numbers come from Chromium on the developer's machine with a simulated CPU
  slowdown. They show how two builds differ; they do not predict speed on a
  real iPad or Android tablet.
- A frame counts as rendered when the main thread has finished its style,
  layout and paint. Compositing and display happen after that and are not
  measured.
- A grid counts as shown once it is laid out with its tiles. Symbol images
  that load after that frame are not measured, so a change that only slows
  symbol loading goes unnoticed.
- Other load on the machine cancels out between the builds but widens the
  confidence intervals, so small changes go unflagged. A machine that sleeps
  mid-run stalls the browser and fails the journey.
- The lab says whether a timing changed, not why. To find out, record the
  journey in Chrome DevTools → Performance.
- Not covered: WebKit/Safari, built-in AI, real speech, memory, imports, CI.
