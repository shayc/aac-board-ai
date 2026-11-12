# Performance lab

A local harness that runs user journeys against production builds. It answers
two questions: is the app healthy right now (the x-ray), and did a change make
it slower than a git ref (a comparison). It runs on your machine only: no
telemetry, uploads, accounts or hosted dashboards.

## Take an x-ray

```bash
npm run perf
```

Builds the working tree, runs every journey 5 times and prints one row per
budget in about a minute. Keep the machine awake and otherwise idle while it
runs.

```text
Perf x-ray: 1 over, 1 watch, 6 ok

  over   JS shipped (gzip)         431 kB  budget 420 kB
  watch  open linked board         588 ms  budget 600 ms  (2 of 5 samples over)
  ok     word tap                 30.8 ms  budget 100 ms
  ok     back                      154 ms  budget 300 ms
  …
```

The first line is the verdict. Each row shows the median of its samples next
to its budget, problems first, then in the order of how often a user meets
each one:

- `ok`: the samples are within budget, give or take one stray in five.
- `over`: the samples are beyond budget, give or take one stray in five.
- `watch`: the samples fell on both sides. Either the timing sits at its
  budget or the machine was busy, so rerun on an idle machine before reading
  anything into it.

An x-ray reports; it does not gate. Rows that are over leave the exit code at
0, and only a broken journey fails the run. The rows, their samples and the
verdict are also written to `perf-results/xray.json`, which is the place to
read them from a script or an agent.

Run it after changing startup, the grid, tiles, the message bar or imports.
When a row moves and you want to know whether your change did it, run a
comparison.

### Budgets

The budgets live in [perf/budgets.ts](../perf/budgets.ts), one line each. A
word tap is budgeted at the 100 ms a tap can take and still feel instant. The
others are round numbers about half again above what the lab measured when
they were set, because a busy machine alone slows a run by a quarter and a row
should only go over when something is clearly wrong. Timings are tied to the
machine that set them; on other hardware, re-measure before trusting a row.
`JS shipped` is every script in the build, gzipped, and is the same on any
machine.

Every timing a journey records needs a budget, and every budget needs a
measurement: the run fails if either is missing. The timing limits hold for
the CPU slowdown in [perf/settings.ts](../perf/settings.ts); changing it
shifts every timing, so re-measure them in the same change.

## Compare with a git ref

```bash
npm run perf -- --base main
```

Builds the working tree and `main`, runs every journey on both for 10 rounds,
prints how their timings differ and writes every sample to
`perf-results/results.json`. Any commit, branch or tag works as the base.

```bash
npm run perf -- --base main --rounds 2
```

Runs 2 rounds for a quick check that the journeys still work on both builds.
That is too few to flag a change, and the output says so. A comparison needs an
even number, so each build goes first in half the rounds. `--rounds` also sets
the number of samples an x-ray takes.

The base ref is checked out into a temporary git worktree, gets its own
`npm ci`, and is built there. That takes a few minutes the first time; the
build is kept in `perf-results/base/` and reused until the ref points at
another commit. Delete `perf-results/base/` to rebuild it anyway, for instance
after changing Node versions. Everything under `perf-results/` is generated and
gitignored.

The builds and the journeys print nothing unless they fail, so the report is
the whole output. To watch a slow step, such as the first build of a base ref,
add `--verbose`:

```bash
npm run perf -- --base main --verbose
```

## Journeys

| Journey           | What happens                                                                                                      | Timings                                                                        |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `startup`         | Empty storage → onboarding → tap Continue → First Words grid. Then a new page once the app is installed.          | `firstLaunch.toOnboarding`, `firstLaunch.continueToGrid`, `returnVisit.toGrid` |
| `tileInteraction` | Download Quick Core 60 from the library. On it: tap I, want, to, open the linked “eat” board, tap drink, go back. | `importBoardSet`, `wordTap`, `openBoardToGrid`, `backToGrid`                   |

Every journey asserts what the user would see, so a broken journey fails the
run instead of reporting fast numbers. The journeys live in
[perf/journeys.spec.ts](../perf/journeys.spec.ts), the harness in
[perf/harness.ts](../perf/harness.ts), and the part that runs inside the page
in [perf/page-perf.ts](../perf/page-perf.ts).

In a comparison the same journeys drive both builds, so they have to work on
both. If a change renames a button a journey taps, the run fails on the base
build; compare against a ref that already has the new name.

## Read a comparison

```text
tileInteraction
  wordTap    62.0 → 71.5 ms    +9.4 ms (+15.2%)    [+7.9 to +11.0]    p=0.012  ← regression
```

Each row shows the base and current medians, the typical per-round difference
(the Hodges–Lehmann estimate) with its 95% confidence interval, and the
adjusted p-value. A row is flagged when that p is below 0.05; how much the
change matters is for you to judge from the difference and its interval.

## Find out why

The lab says whether a timing changed or went over, not why. A performance
trace of the journey does: it shows the long tasks, layouts and layout shifts
behind a slow row.

In VS Code, an agent can record one with the `chrome-devtools` server in
[.vscode/mcp.json](../.vscode/mcp.json) and get a short summary of what is
slow. Other agents read their own MCP configuration and need the server added
there. To trace what the lab measured, match its setup:

```bash
npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

- Trace this production build, not `npm run dev`: a dev-server trace is mostly
  Vite loading modules one by one.
- Slow the CPU 4×, the `CPU_SLOWDOWN` in [perf/settings.ts](../perf/settings.ts),
  and use a 1280×720 viewport.
- Repeat the journey's taps from [perf/journeys.spec.ts](../perf/journeys.spec.ts).

Two differences remain. The server drives Chrome rather than the lab's
Chromium, so built-in AI may be available and suggestions may run. And speech
is real, where the lab stubs it, so a word tap includes the call that starts
speaking. Read those parts of a trace as extra work the lab does not time.

The server starts Chrome with a fresh profile each time (`--isolated`), so
storage and the service worker start empty, as in a first launch. It is also
set not to send usage statistics or trace URLs to Google
(`--no-usage-statistics`, `--no-performance-crux`). Without the server, record
the same steps in Chrome DevTools → Performance.

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

- Builds come from `vite build`, skipping the typecheck in `npm run build`, and
  each is served with `vite preview` on its own 127.0.0.1 port: the working
  tree's on 4173, reusing the `webServer` from
  [playwright.config.ts](../playwright.config.ts), and a comparison's base ref
  on 4174. The ports are fixed, so a second run on the same machine fails
  instead of sharing the CPU with the first.
  [perf/playwright.config.ts](../perf/playwright.config.ts) extends that
  config, so `npm run test:pwa` never runs the journeys, and replaces its
  browser projects with Chromium alone.
- Browser: Playwright's bundled Chromium in new headless mode, Desktop Chrome
  device settings (1280×720), en-US, service worker on.
- A timing runs from its start (navigation, or a tap's `pointerdown`) to the
  first rendered frame that shows its result, read with `performance.now()`. A
  result that does not appear within 15 seconds, or 60 for the import, fails
  the journey.
- The CPU is slowed 4× with `Emulation.setCPUThrottlingRate` during the timed
  steps. Setup around them runs at full speed, and that includes the board set
  import: `importBoardSet` runs from the tap on Download to the set appearing
  in the library, unslowed.
- One journey at a time, one worker, a fresh browser context per sample, and
  one discarded warm-up sample per build. An x-ray measures the working tree
  alone. A timing taken several times in one
  sample, such as word taps, contributes that sample's median.
- `speechSynthesis` is stubbed in the page to end on a microtask, mirroring
  [stub-speech.ts](../src/shared/testing/stub-speech.ts), which depends on
  Vitest. Built-in AI is unavailable in this Chromium.
- Host resolution fails for every host except 127.0.0.1.
- The app code has no performance marks; everything is observed from outside.
  The journeys find the message's parts by position: the children of the
  element before the play button.

`npm run test:perf` runs the unit tests for the statistics, the verdicts, the
scorecard and its report with Node's built-in test runner.

## Limits

- Numbers come from Chromium on the developer's machine with a simulated CPU
  slowdown. They show how two builds differ, or whether a timing left its
  usual range; they do not predict speed on a real iPad or Android tablet.
- An x-ray compares against fixed budgets, so a machine that is busy for the
  whole run reads slow across the board. A comparison cancels that out.
- A frame counts as rendered when the main thread has finished its style,
  layout and paint. Compositing and display happen after that and are not
  measured.
- A grid counts as shown once it is laid out with its tiles. Symbol images
  that load after that frame are not measured, so a change that only slows
  symbol loading goes unnoticed.
- In a comparison, other load on the machine cancels out between the builds but widens the
  confidence intervals, so small changes go unflagged. A machine that sleeps
  mid-run stalls the browser and fails the journey.
- The lab says whether a timing changed or went over, not why. To find out,
  trace the journey; see [Find out why](#find-out-why).
- Not covered: WebKit/Safari, built-in AI, real speech, memory, imports from a
  file or a link, CI.
