import { execFileSync, spawn } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join, relative } from "node:path";
import { parseArgs } from "node:util";
import { gzipSync } from "node:zlib";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { build, preview } from "vite";
import { createApp, type Flow } from "./flow.ts";
import { generateReport } from "./report.ts";
import {
  RESULTS_DIR,
  ROOT,
  type BundleFile,
  type RunMeta,
  type RunMetrics,
  type Settings,
} from "./results.ts";
import { extractCPUProfile, summarizeTrace, type TraceEvent } from "./trace.ts";

const FLOWS_DIR = join(import.meta.dirname, "flows");

const SETTINGS: Settings = {
  warmups: 2,
  cpuSlowdown: 4,
  network: { latencyMs: 40, downloadKbps: 10_240, uploadKbps: 5_120 },
  viewport: { width: 1280, height: 800 },
  locale: "en-US",
  timezone: "UTC",
};

const SPAN_TIMEOUT_MS = 60_000;

const TRACE_CATEGORIES = [
  "-*",
  "toplevel",
  "devtools.timeline",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.frame",
  "blink.user_timing",
  "latencyInfo",
  "loading",
  "v8.execute",
  "disabled-by-default-v8.cpu_profiler",
];

interface Options {
  flowIds: string[] | undefined;
  runs: number;
  shouldOpen: boolean;
}

function readOptions(): Options {
  const { values } = parseArgs({
    options: {
      flows: { type: "string" },
      runs: { type: "string", default: "10" },
      open: { type: "boolean", default: true },
      "no-open": { type: "boolean" },
    },
  });

  return {
    flowIds: values.flows?.split(",").map((id) => id.trim()),
    runs: Number(values.runs),
    shouldOpen: values.open && !values["no-open"],
  };
}

function readCommit(): string {
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  const isDirty = git("status", "--porcelain", "--untracked-files=no") !== "";

  return `${git("rev-parse", "--short", "HEAD")}${isDirty ? "-dirty" : ""}`;
}

async function buildApp(outDir: string, isPerfBuild: boolean): Promise<void> {
  process.env.VITE_PERF = isPerfBuild ? "true" : "";
  await build({
    root: ROOT,
    logLevel: "warn",
    build: { outDir, emptyOutDir: true, manifest: true },
  });
  delete process.env.VITE_PERF;
}

interface ManifestChunk {
  file: string;
  css?: string[];
  imports?: string[];
  isEntry?: boolean;
}

function readBundleFiles(outDir: string): BundleFile[] {
  const manifest = JSON.parse(
    readFileSync(join(outDir, ".vite", "manifest.json"), "utf8"),
  ) as Record<string, ManifestChunk>;
  const initial = new Set<string>();
  const visit = (key: string) => {
    const chunk = manifest[key];
    if (!chunk || initial.has(chunk.file)) {
      return;
    }
    initial.add(chunk.file);
    chunk.css?.forEach((file) => initial.add(file));
    chunk.imports?.forEach(visit);
  };
  Object.keys(manifest)
    .filter((key) => manifest[key].isEntry)
    .forEach(visit);

  return readdirSync(join(outDir, "assets"))
    .filter((file) => /\.(js|css)$/.test(file))
    .map((name) => {
      const file = `assets/${name}`;
      const contents = readFileSync(join(outDir, file));

      return {
        file,
        type: name.endsWith(".css") ? "css" : "js",
        bytes: contents.byteLength,
        gzipBytes: gzipSync(contents).byteLength,
        isInitial: initial.has(file),
      } satisfies BundleFile;
    });
}

async function loadFlows(
  ids: string[] | undefined,
): Promise<Map<string, Flow>> {
  const files = readdirSync(FLOWS_DIR).filter((file) => file.endsWith(".ts"));
  const flows = new Map<string, Flow>();

  for (const file of files.toSorted()) {
    const id = basename(file, ".ts");
    if (ids && !ids.includes(id)) {
      continue;
    }

    const module = (await import(join(FLOWS_DIR, file))) as { default: Flow };
    flows.set(id, module.default);
  }

  const unknown = ids?.filter((id) => !flows.has(id)) ?? [];
  if (unknown.length > 0) {
    throw new Error(`Unknown flows: ${unknown.join(", ")}`);
  }

  return flows;
}

function preparePage(isFirstVisit: boolean): void {
  Object.defineProperty(console, "timeStamp", { value: undefined });
  localStorage.clear();
  if (!isFirstVisit) {
    localStorage.setItem("has-seen-onboarding", "true");
  }

  for (const name of [
    "Proofreader",
    "Rewriter",
    "Translator",
    "LanguageModel",
  ]) {
    Object.defineProperty(window, name, { value: undefined });
  }

  speechSynthesis.getVoices = () => [];
  speechSynthesis.cancel = () => undefined;
  speechSynthesis.speak = (utterance) => {
    setTimeout(() => utterance.dispatchEvent(new Event("end")), 200);
  };
}

async function newContext(
  browser: Browser,
  flow: Flow,
): Promise<BrowserContext> {
  const context = await browser.newContext({
    viewport: SETTINGS.viewport,
    deviceScaleFactor: 1,
    locale: SETTINGS.locale,
    timezoneId: SETTINGS.timezone,
    colorScheme: "light",
    serviceWorkers: "block",
  });
  await context.addInitScript(preparePage, Boolean(flow.isFirstVisit));

  return context;
}

async function openBoard(page: Page, origin: string): Promise<void> {
  await page.goto(origin);
  await page.waitForFunction(() => window.__perf !== undefined);
  await page.evaluate(() => window.__perf?.waitForSpan("load:app:board", 0));
}

async function newPrimedContext(
  browser: Browser,
  flow: Flow,
  origin: string,
): Promise<BrowserContext> {
  const context = await newContext(browser, flow);

  if (!flow.isFirstVisit) {
    const page = await context.newPage();
    await openBoard(page, origin);
    await page.close();
  }

  return context;
}

async function throttle(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  const { latencyMs, downloadKbps, uploadKbps } = SETTINGS.network;

  await cdp.send("Emulation.setCPUThrottlingRate", {
    rate: SETTINGS.cpuSlowdown,
  });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: latencyMs,
    downloadThroughput: (downloadKbps * 1024) / 8,
    uploadThroughput: (uploadKbps * 1024) / 8,
  });
}

async function waitForSpan(page: Page, flow: Flow, since: number) {
  await page.waitForFunction(() => window.__perf !== undefined);

  const span = await page.evaluate(
    ([name, start, timeout]) =>
      Promise.race([
        window.__perf?.waitForSpan(name, start),
        new Promise<undefined>((resolve) => setTimeout(resolve, timeout)),
      ]),
    [flow.span, since, SPAN_TIMEOUT_MS] as const,
  );
  if (!span) {
    const screenshot = join(RESULTS_DIR, "failure.png");
    await page.screenshot({ path: screenshot });
    throw new Error(
      `"${flow.title}" did not record ${flow.span}; see ${relative(ROOT, screenshot)}`,
    );
  }

  return span;
}

type RunResult = Omit<RunMetrics, "flow" | "run">;

async function runOnce(
  browser: Browser,
  context: BrowserContext,
  flow: Flow,
  origin: string,
  runDir: string | undefined,
): Promise<RunResult | undefined> {
  const page = await context.newPage();
  const app = createApp(page, origin);

  if (flow.kind === "interaction") {
    await openBoard(page, origin);
    await flow.setup?.(app);
  } else {
    await page.goto(new URL("/board.svg", origin).href);
  }

  await throttle(page);
  const windowStart =
    flow.kind === "interaction"
      ? await page.evaluate(() => window.__perf?.beginWindow() ?? 0)
      : 0;

  if (runDir) {
    await browser.startTracing(page, { categories: TRACE_CATEGORIES });
  }

  await flow.run(app);
  const span = await waitForSpan(page, flow, windowStart);
  await page.evaluate(() => window.__perf?.settle());

  const traceBuffer = runDir ? await browser.stopTracing() : undefined;
  const snapshot = await page.evaluate(() => window.__perf?.snapshot());
  await page.close();

  if (!runDir || !traceBuffer || !snapshot) {
    return undefined;
  }

  const { traceEvents } = JSON.parse(traceBuffer.toString("utf8")) as {
    traceEvents: TraceEvent[];
  };
  const profile = extractCPUProfile(traceEvents, flow.span);

  mkdirSync(runDir, { recursive: true });
  writeFileSync(join(runDir, "trace.json.gz"), gzipSync(traceBuffer));
  if (profile) {
    writeFileSync(join(runDir, "cpu.cpuprofile"), JSON.stringify(profile));
  }

  return {
    span,
    windowStart,
    trace: summarizeTrace(traceEvents, flow.span),
    snapshot,
  };
}

interface FlowState {
  id: string;
  flow: Flow;
  sharedContext: BrowserContext | undefined;
}

async function runRound(
  browser: Browser,
  states: FlowState[],
  origin: string,
  resultDir: string,
  run: number,
): Promise<void> {
  const durations: string[] = [];

  for (const { id, flow, sharedContext } of states) {
    const context =
      sharedContext ?? (await newPrimedContext(browser, flow, origin));
    const runDir =
      run > 0
        ? join(resultDir, "runs", id, String(run).padStart(2, "0"))
        : undefined;

    const result = await runOnce(browser, context, flow, origin, runDir);
    if (result && runDir) {
      const metrics: RunMetrics = { flow: id, run, ...result };
      writeFileSync(join(runDir, "metrics.json"), JSON.stringify(metrics));
      durations.push(
        `${id} ${(result.span.endTime - result.span.startTime).toFixed(0)}`,
      );
    }

    if (!sharedContext) {
      await context.close();
    }
  }

  const label = run > 0 ? `Run ${run}` : `Warm-up ${run + SETTINGS.warmups}`;
  console.log(
    `${label}${durations.length > 0 ? `: ${durations.join(", ")} ms` : ""}`,
  );
}

async function runFlows(
  browser: Browser,
  flows: Map<string, Flow>,
  origin: string,
  resultDir: string,
  runs: number,
): Promise<void> {
  const states: FlowState[] = [];
  for (const [id, flow] of flows) {
    const isolateRuns = flow.isolateRuns || flow.isFirstVisit;
    states.push({
      id,
      flow,
      sharedContext: isolateRuns
        ? undefined
        : await newPrimedContext(browser, flow, origin),
    });
  }

  try {
    for (let run = 1 - SETTINGS.warmups; run <= runs; run += 1) {
      await runRound(browser, states, origin, resultDir, run);
    }
  } finally {
    await Promise.all(
      states.flatMap(({ sharedContext }) =>
        sharedContext ? [sharedContext.close()] : [],
      ),
    );
  }
}

function openFile(path: string): void {
  const [command, ...args] =
    process.platform === "darwin"
      ? ["open", path]
      : process.platform === "win32"
        ? ["cmd", "/c", "start", "", path]
        : ["xdg-open", path];
  spawn(command, args, { detached: true, stdio: "ignore" }).unref();
}

async function main(): Promise<void> {
  const options = readOptions();
  const flows = await loadFlows(options.flowIds);
  const commit = readCommit();
  const date = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
  const resultDir = join(RESULTS_DIR, `${date}-${commit}`);
  const productionDir = join(resultDir, "build-production");

  console.log(`Building into ${relative(ROOT, resultDir)}`);
  await buildApp(productionDir, false);
  writeFileSync(
    join(resultDir, "bundles.json"),
    JSON.stringify(readBundleFiles(productionDir), null, 2),
  );
  rmSync(productionDir, { recursive: true });
  await buildApp(join(resultDir, "build"), true);

  const server = await preview({
    root: ROOT,
    logLevel: "warn",
    build: { outDir: join(resultDir, "build") },
    preview: { host: "127.0.0.1", port: 4300, strictPort: false },
  });
  const origin = server.resolvedUrls?.local[0];
  if (!origin) {
    throw new Error("Preview server has no URL");
  }

  const browser = await chromium.launch();
  const browserVersion = browser.version();
  try {
    console.log(`Running ${flows.size} flows: ${[...flows.keys()].join(", ")}`);
    await runFlows(browser, flows, origin, resultDir, options.runs);
  } finally {
    await browser.close();
    await server.close();
  }

  const meta: RunMeta = {
    date: new Date().toISOString(),
    commit,
    browser: `Chromium ${browserVersion}`,
    node: process.version,
    runs: options.runs,
    settings: SETTINGS,
    flows: Array.from(flows, ([id, flow]) => ({
      id,
      title: flow.title,
      span: flow.span,
      kind: flow.kind,
    })),
  };
  writeFileSync(join(resultDir, "meta.json"), JSON.stringify(meta, null, 2));

  const reportPath = generateReport(resultDir);
  console.log(`Report: ${relative(ROOT, reportPath)}`);

  if (options.shouldOpen) {
    openFile(reportPath);
  }
}

await main();
