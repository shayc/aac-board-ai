import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  InteractionRecord,
  PerfSnapshot,
  RenderRecord,
  VitalName,
} from "../src/perf/perf-snapshot.ts";
import type {
  BundleFile,
  FlowInfo,
  ResultSummary,
  RunMeta,
  RunMetrics,
} from "./results.ts";
import { SourceMaps } from "./source-maps.ts";
import {
  normalizeCPUProfile,
  type Breakdown,
  type CPUProfile,
  type CPUProfileNode,
} from "./trace.ts";

export interface Stat {
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  count: number;
}

export interface Threshold {
  good: number;
  poor: number;
}

export type Rating = "good" | "needs-improvement" | "poor" | "none";

export interface Budgets {
  LCP: Threshold;
  routeLCP: Threshold;
  INP: Threshold;
  CLS: Threshold;
  totalJSGzipBytes: Threshold;
  spans: Record<string, Threshold>;
}

export interface FlowReport extends FlowInfo {
  duration: Stat;
  budget: Threshold;
  rating: Rating;
  breakdown: Breakdown;
  inp?: Stat;
  inpDetail?: {
    type: string;
    target: string;
    inputDelay: number;
    processing: number;
    presentation: number;
  };
  lcp?: Stat;
  lcpTarget?: string;
  routeLCP?: Stat;
  cls?: Stat;
  ttfb?: Stat;
  fcp?: Stat;
  commits: Stat;
  commitsPerInteraction: number;
  longFrames: Stat;
  representativeRun: string;
}

export interface Hotspot {
  kind: "function" | "frame" | "component" | "request";
  name: string;
  location: string;
  score: number;
  flows: string[];
  cause: string;
  trace: string;
}

export interface Row {
  [column: string]: string | number;
}

export interface Headline {
  label: string;
  value: number | undefined;
  unit: "ms" | "score" | "bytes";
  budget: Threshold;
  rating: Rating;
  detail: string;
}

export interface Report {
  meta: RunMeta;
  headlines: Headline[];
  hotspots: Hotspot[];
  flows: FlowReport[];
  tables: {
    functions: Row[];
    components: Row[];
    interactions: Row[];
    frames: Row[];
    requests: Row[];
    operations: Row[];
    bundles: Row[];
  };
  variation: {
    withinRun: number;
    previous?: { label: string; median: number; max: number; maxFlow: string };
  };
  summary: ResultSummary;
}

interface FunctionSample {
  name: string;
  location: string;
  self: number;
  total: number;
}

interface FlowRun {
  dir: string;
  metrics: RunMetrics;
  functions: Map<string, FunctionSample>;
}

const IGNORED_FRAMES = new Set(["(root)", "(program)", "(idle)"]);
const MIN_TABLE_MS = 0.5;
const MAX_TABLE_ROWS = 120;
const HOTSPOT_COUNT = 10;

export function stat(values: number[]): Stat {
  const sorted = values.filter(Number.isFinite).toSorted((a, b) => a - b);
  const quantile = (q: number) => {
    if (sorted.length === 0) {
      return Number.NaN;
    }
    const position = (sorted.length - 1) * q;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  };
  const q1 = quantile(0.25);
  const q3 = quantile(0.75);

  return { median: quantile(0.5), q1, q3, iqr: q3 - q1, count: sorted.length };
}

function rate(value: number | undefined, threshold: Threshold): Rating {
  if (value === undefined || Number.isNaN(value)) {
    return "none";
  }
  if (value <= threshold.good) {
    return "good";
  }

  return value <= threshold.poor ? "needs-improvement" : "poor";
}

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts).toSorted((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

function readJSON<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

interface FrameDescription {
  key: string;
  name: string;
  location: string;
  isInstrumentation: boolean;
}

function frameLocation(
  node: CPUProfileNode,
  maps: SourceMaps,
): { name: string; location: string } {
  const { functionName, url, lineNumber, columnNumber } = node.callFrame;
  const mapped = maps.lookupFunction(
    url,
    lineNumber,
    columnNumber,
    functionName,
  );
  if (mapped) {
    return {
      name: mapped.name ?? (functionName || "(anonymous)"),
      location: `${mapped.source}:${mapped.line}`,
    };
  }

  const asset = SourceMaps.assetFile(url);

  return {
    name: functionName || "(top level)",
    location: asset ? `${asset} (unmapped)` : url || "native",
  };
}

function isInjectedFrame(node: CPUProfileNode): boolean {
  const { url, lineNumber } = node.callFrame;

  return url === "" && lineNumber >= 0;
}

function isInstrumentationFrame(name: string, location: string): boolean {
  return (
    location.startsWith("src/perf/") ||
    location.includes("node_modules/web-vitals/") ||
    (location.includes("react-dom-profiling") && /^log[A-Z]/.test(name))
  );
}

function profileFunctions(
  profile: CPUProfile,
  window: { start: number; end: number },
  maps: SourceMaps,
): Map<string, FunctionSample> {
  const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
  const parents = new Map<number, number>();
  for (const node of profile.nodes) {
    for (const child of node.children ?? []) {
      parents.set(child, node.id);
    }
  }

  const ancestorsOf = function* (id: number) {
    for (
      let current: number | undefined = id;
      current !== undefined;
      current = parents.get(current)
    ) {
      yield current;
    }
  };

  const nearestScriptLocation = (id: number): string => {
    for (const ancestor of ancestorsOf(id)) {
      const node = nodes.get(ancestor);
      if (node && node.callFrame.url !== "" && !isInjectedFrame(node)) {
        return frameLocation(node, maps).location;
      }
    }
    return "native";
  };

  const describeFrame = (
    node: CPUProfileNode,
  ): FrameDescription | undefined => {
    const { functionName, url } = node.callFrame;
    if (IGNORED_FRAMES.has(functionName) || isInjectedFrame(node)) {
      return undefined;
    }
    if (functionName === "(garbage collector)") {
      return {
        key: "gc",
        name: functionName,
        location: "V8",
        isInstrumentation: false,
      };
    }
    if (url === "") {
      const name = `${functionName} (native)`;
      const location = nearestScriptLocation(node.id);
      return {
        key: `${name}@${location}`,
        name,
        location,
        isInstrumentation: false,
      };
    }

    const { name, location } = frameLocation(node, maps);
    return {
      key: `${name}@${location}`,
      name,
      location,
      isInstrumentation: isInstrumentationFrame(name, location),
    };
  };

  const descriptions = new Map<number, FrameDescription | undefined>();
  const describe = (id: number) => {
    if (!descriptions.has(id)) {
      const node = nodes.get(id);
      descriptions.set(id, node ? describeFrame(node) : undefined);
    }
    return descriptions.get(id);
  };

  const functions = new Map<string, FunctionSample>();
  let time = profile.startTime;

  profile.samples.forEach((sampleId, index) => {
    time += profile.timeDeltas[index] ?? 0;
    if (time < window.start || time > window.end || !describe(sampleId)) {
      return;
    }

    const stack = Array.from(ancestorsOf(sampleId), describe).filter(
      (description) => description !== undefined,
    );
    if (stack.some((description) => description.isInstrumentation)) {
      return;
    }

    const duration = (profile.timeDeltas[index + 1] ?? 0) / 1000;
    const seen = new Set<string>();
    stack.forEach((description, depth) => {
      if (seen.has(description.key)) {
        return;
      }
      seen.add(description.key);
      const entry = functions.get(description.key) ?? {
        name: description.name,
        location: description.location,
        self: 0,
        total: 0,
      };
      entry.total += duration;
      entry.self += depth === 0 ? duration : 0;
      functions.set(description.key, entry);
    });
  });

  return functions;
}

function loadRuns(
  resultDir: string,
  flow: FlowInfo,
  maps: SourceMaps,
): FlowRun[] {
  const flowDir = join(resultDir, "runs", flow.id);
  if (!existsSync(flowDir)) {
    return [];
  }

  return readdirSync(flowDir)
    .toSorted()
    .flatMap((run) => {
      const dir = join(flowDir, run);
      const metricsPath = join(dir, "metrics.json");
      if (!existsSync(metricsPath)) {
        return [];
      }

      const metrics = readJSON<RunMetrics>(metricsPath);
      const profilePath = join(dir, "cpu.cpuprofile");
      const functions =
        existsSync(profilePath) && metrics.trace
          ? profileFunctions(
              normalizeCPUProfile(readJSON<CPUProfile>(profilePath)),
              metrics.trace.window,
              maps,
            )
          : new Map<string, FunctionSample>();

      return [{ dir: `runs/${flow.id}/${run}`, metrics, functions }];
    });
}

function spanDuration(run: FlowRun): number {
  return run.metrics.span.endTime - run.metrics.span.startTime;
}

function closestRun(runs: FlowRun[], value: (run: FlowRun) => number): FlowRun {
  const target = stat(runs.map(value)).median;

  return runs.toSorted(
    (a, b) => Math.abs(value(a) - target) - Math.abs(value(b) - target),
  )[0];
}

function maxInteraction(snapshot: PerfSnapshot): InteractionRecord | undefined {
  return snapshot.interactions.toSorted((a, b) => b.duration - a.duration)[0];
}

function loadVital(snapshot: PerfSnapshot, name: VitalName) {
  return snapshot.vitals.find(
    (vital) =>
      vital.name === name && vital.navigationType !== "soft-navigation",
  );
}

function routeLCPValue(snapshot: PerfSnapshot): number | undefined {
  const values = snapshot.vitals
    .filter(
      (vital) =>
        vital.name === "LCP" &&
        vital.navigationType === "soft-navigation" &&
        vital.navigationStartTime >= snapshot.windowStart,
    )
    .map((vital) => vital.value);

  return values.length > 0 ? Math.max(...values) : undefined;
}

function optionalStat(values: (number | undefined)[]): Stat | undefined {
  const defined = values.filter(
    (value): value is number => value !== undefined,
  );

  return defined.length > 0 ? stat(defined) : undefined;
}

function commitCount(renders: RenderRecord[]): number {
  return new Set(
    renders
      .filter((render) => render.id === "App")
      .map((render) => render.commitTime),
  ).size;
}

function summarizeFlow(
  flow: FlowInfo,
  runs: FlowRun[],
  budgets: Budgets,
): FlowReport {
  const snapshots = runs.map((run) => run.metrics.snapshot);
  const duration = stat(runs.map(spanDuration));
  const budget = budgets.spans[flow.span] ?? budgets.spans.default;
  const breakdownOf = (key: keyof Breakdown) =>
    stat(runs.map((run) => run.metrics.trace?.breakdown[key] ?? Number.NaN))
      .median || 0;
  const interactions = snapshots.map(maxInteraction);
  const definedInteractions = interactions.filter(
    (interaction): interaction is InteractionRecord =>
      interaction !== undefined,
  );
  const commits = stat(
    snapshots.map((snapshot) => commitCount(snapshot.renders)),
  );
  const inputs = stat(
    snapshots.map((snapshot) => snapshot.interactionCount),
  ).median;
  const isLoad = flow.kind === "load";

  return {
    ...flow,
    duration,
    budget,
    rating: rate(duration.median, budget),
    breakdown: {
      network: breakdownOf("network"),
      scripting: breakdownOf("scripting"),
      rendering: breakdownOf("rendering"),
      idle: breakdownOf("idle"),
    },
    inp: isLoad
      ? undefined
      : optionalStat(
          interactions.map((interaction) => interaction?.duration ?? 0),
        ),
    inpDetail:
      definedInteractions.length > 0
        ? {
            type: mostCommon(
              definedInteractions.map((interaction) => interaction.type),
            ),
            target: mostCommon(
              definedInteractions.map((interaction) => interaction.target),
            ),
            inputDelay: stat(
              definedInteractions.map((interaction) => interaction.inputDelay),
            ).median,
            processing: stat(
              definedInteractions.map(
                (interaction) => interaction.processingDuration,
              ),
            ).median,
            presentation: stat(
              definedInteractions.map(
                (interaction) => interaction.presentationDelay,
              ),
            ).median,
          }
        : undefined,
    lcp: isLoad
      ? optionalStat(
          snapshots.map((snapshot) => loadVital(snapshot, "LCP")?.value),
        )
      : undefined,
    lcpTarget: isLoad
      ? mostCommon(
          snapshots.map((snapshot) =>
            String(loadVital(snapshot, "LCP")?.attribution.target ?? ""),
          ),
        )
      : undefined,
    routeLCP: flow.span.startsWith("route:")
      ? optionalStat(snapshots.map(routeLCPValue))
      : undefined,
    cls: isLoad
      ? optionalStat(
          snapshots.map((snapshot) => loadVital(snapshot, "CLS")?.value),
        )
      : stat(
          snapshots.map((snapshot) =>
            snapshot.layoutShifts
              .filter((shift) => !shift.hadRecentInput)
              .reduce((sum, shift) => sum + shift.value, 0),
          ),
        ),
    ttfb: isLoad
      ? optionalStat(
          snapshots.map((snapshot) => loadVital(snapshot, "TTFB")?.value),
        )
      : undefined,
    fcp: isLoad
      ? optionalStat(
          snapshots.map((snapshot) => loadVital(snapshot, "FCP")?.value),
        )
      : undefined,
    commits,
    commitsPerInteraction:
      inputs > 0 ? commits.median / inputs : commits.median,
    longFrames: stat(
      snapshots.map((snapshot) => snapshot.longAnimationFrames.length),
    ),
    representativeRun: closestRun(runs, spanDuration).dir,
  };
}

interface Contribution {
  name: string;
  location: string;
  flow: FlowInfo;
  perRun: { run: FlowRun; value: number }[];
}

function collect<T>(
  runsByFlow: Map<FlowInfo, FlowRun[]>,
  extract: (
    run: FlowRun,
  ) => Map<string, T & { value: number; name: string; location: string }>,
): Map<string, Contribution[]> {
  const byKey = new Map<string, Contribution[]>();

  for (const [flow, runs] of runsByFlow) {
    const perFlow = new Map<string, Contribution>();
    for (const run of runs) {
      for (const [key, item] of extract(run)) {
        const contribution = perFlow.get(key) ?? {
          name: item.name,
          location: item.location,
          flow,
          perRun: [],
        };
        contribution.perRun.push({ run, value: item.value });
        perFlow.set(key, contribution);
      }
    }
    for (const [key, contribution] of perFlow) {
      byKey.set(key, [...(byKey.get(key) ?? []), contribution]);
    }
  }

  return byKey;
}

function contributionMedian(
  contribution: Contribution,
  runCount: number,
): number {
  const values = contribution.perRun.map((entry) => entry.value);
  const missing = Math.max(0, runCount - values.length);

  return stat([...values, ...Array<number>(missing).fill(0)]).median;
}

const CAUSES: { test: RegExp; cause: string }[] = [
  {
    test: /performWorkUntilDeadline|scheduler/,
    cause: "React render and commit work batched into one long task",
  },
  {
    test: /\(module-script\)|\(classic-script\)/,
    cause: "Evaluating JavaScript modules at startup",
  },
  {
    test: /open-board-format|unzip/,
    cause: "Unzipping and parsing the OBZ archive on the main thread",
  },
  {
    test: /import-from-url/,
    cause: "Buffering the board download stream chunk by chunk",
  },
  {
    test: /transitions\/utils|reflow/,
    cause: "MUI transition forces a synchronous reflow to start its animation",
  },
  { test: /fflate/, cause: "Decompressing the OBZ archive on the main thread" },
  {
    test: /buildAssetInputs|board-import\.ts/,
    cause: "Copying every archive entry into a Blob during import",
  },
  {
    test: /@emotion|insertRule|murmur2|serializeStyles/,
    cause:
      "Emotion serializes and inserts per-instance sx styles during render",
  },
  {
    test: /node_modules\/idb|IDB/,
    cause: "IndexedDB request bookkeeping on the main thread",
  },
  { test: /createObjectURL/, cause: "Creating object URLs for board assets" },
  { test: /removeChild/, cause: "Tearing down the previous board's DOM" },
  {
    test: /scrollTop|scrollIntoView|offsetParent|getBoundingClientRect|clientWidth|clientHeight|offsetWidth|focus \(native\)/,
    cause: "Forced synchronous layout from a layout read",
  },
  {
    test: /garbage collector/,
    cause: "Garbage collection from allocation pressure",
  },
  {
    test: /locale\.ts|DisplayNames|getNativeLanguageName/,
    cause: "Building language names with Intl on every render",
  },
  { test: /@popperjs|Popper/, cause: "Popper positioning reads layout" },
  { test: /JSON\.parse|parse \(native\)/, cause: "Parsing board JSON" },
  { test: /react-dom/, cause: "React reconciliation and commit work" },
  { test: /@mui/, cause: "MUI component render work" },
];

const FRAME_CAUSES: { test: RegExp; cause: string }[] = [
  {
    test: /node_modules\/idb/,
    cause:
      "Long task resumed from an IndexedDB callback, such as board loading; the Functions table shows what ran inside",
  },
  {
    test: /dispatchDiscreteEvent/,
    cause:
      "Long input handler dispatched by React; the Functions table shows what ran inside",
  },
];

function causeOf(
  kind: Hotspot["kind"],
  name: string,
  location: string,
): string {
  const text = `${name} ${location}`;
  const causes = kind === "frame" ? [...FRAME_CAUSES, ...CAUSES] : CAUSES;
  const fallback =
    kind === "frame"
      ? "Long script in one animation frame; the Functions table shows what ran inside"
      : "Hot code on the main thread; inspect the trace";

  return causes.find(({ test }) => test.test(text))?.cause ?? fallback;
}

function componentLocations(): Map<string, string> {
  const locations = new Map<string, string>([["App", "src/main.tsx"]]);
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(path);
      } else if (
        entry.name.endsWith(".tsx") &&
        !entry.name.endsWith(".test.tsx")
      ) {
        const lines = readFileSync(path, "utf8").split("\n");
        lines.forEach((line, index) => {
          const match = /^export function ([A-Z]\w*)/.exec(line);
          if (match && !locations.has(match[1])) {
            locations.set(
              match[1],
              `${path.slice(path.indexOf("src/"))}:${index + 1}`,
            );
          }
        });
      }
    }
  };
  visit(join(import.meta.dirname, "..", "src"));

  return locations;
}

function componentTimes(
  renders: RenderRecord[],
): Map<string, { count: number; total: number; self: number }> {
  const childTime = new Map<string, number>();
  for (const render of renders) {
    if (render.parent) {
      const key = `${render.parent}@${render.commitTime}`;
      childTime.set(key, (childTime.get(key) ?? 0) + render.actualDuration);
    }
  }

  const times = new Map<
    string,
    { count: number; total: number; self: number }
  >();
  const seenCommits = new Set<string>();
  for (const render of renders) {
    const entry = times.get(render.id) ?? { count: 0, total: 0, self: 0 };
    const commitKey = `${render.id}@${render.commitTime}`;
    entry.count += 1;
    entry.total += render.actualDuration;
    entry.self += render.actualDuration;
    if (!seenCommits.has(commitKey)) {
      seenCommits.add(commitKey);
      entry.self -= childTime.get(commitKey) ?? 0;
    }
    times.set(render.id, entry);
  }

  return times;
}

function scriptLocation(
  script: PerfSnapshot["longAnimationFrames"][number]["scripts"][number],
  maps: SourceMaps,
): { name: string; location: string } {
  const mapped = maps.lookupCharPosition(
    script.sourceURL,
    script.sourceCharPosition,
    script.sourceFunctionName,
  );
  const name =
    mapped?.name || script.sourceFunctionName || script.invoker || "(script)";

  return {
    name: `${name} (${script.invokerType})`,
    location: mapped
      ? `${mapped.source}:${mapped.line}`
      : script.sourceURL || script.invoker,
  };
}

function formatRow(values: Row): Row {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      typeof value === "number" ? Math.round(value * 100) / 100 : value,
    ]),
  );
}

export function analyze(
  resultDir: string,
  budgets: Budgets,
  previous?: ResultSummary,
): Report {
  const meta = readJSON<RunMeta>(join(resultDir, "meta.json"));
  const bundles = readJSON<BundleFile[]>(join(resultDir, "bundles.json"));
  const maps = new SourceMaps(
    join(resultDir, "build"),
    join(import.meta.dirname, ".."),
  );
  const runsByFlow = new Map(
    meta.flows.map((flow) => [flow, loadRuns(resultDir, flow, maps)]),
  );
  const measuredFlows = Array.from(runsByFlow).filter(
    ([, runs]) => runs.length > 0,
  );
  const flows = measuredFlows.map(([flow, runs]) =>
    summarizeFlow(flow, runs, budgets),
  );
  const runCountOf = (flow: FlowInfo) => runsByFlow.get(flow)?.length ?? 0;

  const functionContributions = collect(
    new Map(measuredFlows),
    (run) =>
      new Map(
        Array.from(run.functions, ([key, entry]) => [
          key,
          { ...entry, value: entry.self },
        ]),
      ),
  );
  const totalByFunction = collect(
    new Map(measuredFlows),
    (run) =>
      new Map(
        Array.from(run.functions, ([key, entry]) => [
          key,
          { ...entry, value: entry.total },
        ]),
      ),
  );
  const frameContributions = collect(new Map(measuredFlows), (run) => {
    const scripts = new Map<
      string,
      { name: string; location: string; value: number }
    >();
    for (const frame of run.metrics.snapshot.longAnimationFrames) {
      for (const script of frame.scripts) {
        const { name, location } = scriptLocation(script, maps);
        if (isInstrumentationFrame(name, location)) {
          continue;
        }
        const key = `${name}@${location}`;
        const entry = scripts.get(key) ?? { name, location, value: 0 };
        entry.value += script.duration;
        scripts.set(key, entry);
      }
    }
    return scripts;
  });
  const locations = componentLocations();
  const componentContributions = collect(
    new Map(measuredFlows),
    (run) =>
      new Map(
        Array.from(
          componentTimes(run.metrics.snapshot.renders),
          ([id, times]) => [
            id,
            {
              name: id,
              location: locations.get(id) ?? "src",
              value: times.self,
            },
          ],
        ),
      ),
  );
  const requestContributions = collect(new Map(measuredFlows), (run) => {
    const requests = new Map<
      string,
      { name: string; location: string; value: number }
    >();
    for (const resource of run.metrics.snapshot.resources) {
      if (!resource.url.startsWith("/")) {
        continue;
      }
      const isBundleChunk = resource.url.startsWith("/assets/");
      const name = isBundleChunk
        ? "App bundle chunks (/assets/*)"
        : resource.url;
      const entry = requests.get(name) ?? {
        name,
        location: isBundleChunk ? "parallel downloads" : resource.initiatorType,
        value: 0,
      };
      entry.value = Math.max(entry.value, resource.duration);
      requests.set(name, entry);
    }
    return requests;
  });

  const toHotspots = (
    kind: Hotspot["kind"],
    contributions: Map<string, Contribution[]>,
  ): Hotspot[] =>
    Array.from(contributions.values()).map((perFlow) => {
      const medians = perFlow.map((contribution) => ({
        contribution,
        median: contributionMedian(contribution, runCountOf(contribution.flow)),
      }));
      const score = medians.reduce((sum, { median }) => sum + median, 0);
      const heaviest = medians.toSorted((a, b) => b.median - a.median)[0];
      const { name, location } = heaviest.contribution;
      const representative = closestRun(
        heaviest.contribution.perRun.map((entry) => entry.run),
        (run) =>
          heaviest.contribution.perRun.find((entry) => entry.run === run)
            ?.value ?? 0,
      );
      const flowsAffected = medians
        .filter(({ median }) => median >= Math.max(MIN_TABLE_MS, score * 0.05))
        .toSorted((a, b) => b.median - a.median)
        .map(({ contribution }) => contribution.flow.title);

      return {
        kind,
        name,
        location,
        score,
        flows: flowsAffected,
        cause:
          kind === "request"
            ? "Download on the critical path of the flow"
            : kind === "component"
              ? "Render cost of this subtree, excluding nested profiled components"
              : causeOf(kind, name, location),
        trace: `${representative.dir}/trace.json.gz`,
      };
    });

  const hotspots = [
    ...toHotspots("function", functionContributions),
    ...toHotspots("frame", frameContributions),
    ...toHotspots("component", componentContributions),
    ...toHotspots("request", requestContributions),
  ]
    .filter((hotspot) => hotspot.score > 0)
    .toSorted((a, b) => b.score - a.score)
    .slice(0, HOTSPOT_COUNT);

  const functionRows = Array.from(functionContributions).flatMap(
    ([key, perFlow]) =>
      perFlow.map((contribution) => {
        const self = stat(contribution.perRun.map((entry) => entry.value));
        const total = totalByFunction
          .get(key)
          ?.find((item) => item.flow === contribution.flow);
        return formatRow({
          Function: contribution.name,
          Location: contribution.location,
          Flow: contribution.flow.title,
          "Self median (ms)": self.median,
          "Self IQR (ms)": self.iqr,
          "Total median (ms)": total
            ? stat(total.perRun.map((entry) => entry.value)).median
            : 0,
          Runs: self.count,
        });
      }),
  );

  const componentRows = measuredFlows.flatMap(([flow, runs]) => {
    const perRun = runs.map((run) =>
      componentTimes(run.metrics.snapshot.renders),
    );
    const ids = new Set(perRun.flatMap((times) => Array.from(times.keys())));
    return Array.from(ids, (id) => {
      const durations = stat(perRun.map((times) => times.get(id)?.total ?? 0));
      return formatRow({
        Component: id,
        Flow: flow.title,
        "Renders (median)": stat(
          perRun.map((times) => times.get(id)?.count ?? 0),
        ).median,
        "Duration median (ms)": durations.median,
        "Duration IQR (ms)": durations.iqr,
        "Self median (ms)": stat(
          perRun.map((times) => times.get(id)?.self ?? 0),
        ).median,
        Runs: durations.count,
      });
    });
  });

  const interactionRows = measuredFlows.flatMap(([flow, runs]) => {
    const groups = new Map<string, InteractionRecord[]>();
    for (const run of runs) {
      for (const interaction of run.metrics.snapshot.interactions) {
        const key = `${interaction.type} ${interaction.target}`;
        groups.set(key, [...(groups.get(key) ?? []), interaction]);
      }
    }
    return Array.from(groups.values(), (group) => {
      const duration = stat(group.map((interaction) => interaction.duration));
      return formatRow({
        Flow: flow.title,
        Event: group[0].type,
        Target: group[0].target,
        "Duration median (ms)": duration.median,
        "Duration IQR (ms)": duration.iqr,
        "Input delay (ms)": stat(
          group.map((interaction) => interaction.inputDelay),
        ).median,
        "Processing (ms)": stat(
          group.map((interaction) => interaction.processingDuration),
        ).median,
        "Presentation (ms)": stat(
          group.map((interaction) => interaction.presentationDelay),
        ).median,
        Count: group.length,
      });
    });
  });

  const contributionRows = (
    contributions: Map<string, Contribution[]>,
    columns: (contribution: Contribution, value: Stat) => Row,
  ) =>
    Array.from(contributions.values()).flatMap((perFlow) =>
      perFlow.map((contribution) =>
        formatRow(
          columns(
            contribution,
            stat(contribution.perRun.map((entry) => entry.value)),
          ),
        ),
      ),
    );

  const frameRows = contributionRows(
    frameContributions,
    (contribution, value) => ({
      Script: contribution.name,
      Location: contribution.location,
      Flow: contribution.flow.title,
      "Duration median (ms)": value.median,
      "Duration IQR (ms)": value.iqr,
      Runs: value.count,
    }),
  );

  const requestRows = measuredFlows.flatMap(([flow, runs]) => {
    const groups = new Map<string, PerfSnapshot["resources"]>();
    for (const run of runs) {
      for (const resource of run.metrics.snapshot.resources) {
        groups.set(resource.url, [
          ...(groups.get(resource.url) ?? []),
          resource,
        ]);
      }
    }
    return Array.from(groups.values(), (group) => {
      const duration = stat(group.map((resource) => resource.duration));
      return formatRow({
        Flow: flow.title,
        URL: group[0].url,
        Type: group[0].initiatorType,
        "Transfer (KB)":
          stat(group.map((resource) => resource.transferSize)).median / 1024,
        "Decoded (KB)":
          stat(group.map((resource) => resource.decodedBodySize)).median / 1024,
        "Duration median (ms)": duration.median,
        "Duration IQR (ms)": duration.iqr,
        Count: group.length,
      });
    });
  });

  const operationRows = measuredFlows.flatMap(([flow, runs]) => {
    const names = new Set(
      runs.flatMap((run) =>
        run.metrics.snapshot.operations.map((operation) => operation.name),
      ),
    );
    return Array.from(names, (name) => {
      const perRun = runs.map((run) =>
        run.metrics.snapshot.operations.find(
          (operation) => operation.name === name,
        ),
      );
      const total = stat(perRun.map((operation) => operation?.total ?? 0));
      return formatRow({
        Operation: name,
        Flow: flow.title,
        "Calls (median)": stat(perRun.map((operation) => operation?.count ?? 0))
          .median,
        "Total median (ms)": total.median,
        "Total IQR (ms)": total.iqr,
        "Max (ms)": Math.max(...perRun.map((operation) => operation?.max ?? 0)),
        Runs: total.count,
      });
    });
  });

  const bundleRows = bundles.map((bundle) =>
    formatRow({
      File: bundle.file,
      Type: bundle.type.toUpperCase(),
      "Size (KB)": bundle.bytes / 1024,
      "Gzip (KB)": bundle.gzipBytes / 1024,
      "Loaded on": bundle.isInitial
        ? "Every route (initial load)"
        : "On demand",
    }),
  );

  const loadFlows = flows.filter((flow) => flow.kind === "load");
  const interactionFlows = flows.filter((flow) => flow.kind === "interaction");
  const worst = <T extends FlowReport>(
    list: T[],
    value: (flow: T) => number | undefined,
  ) =>
    list
      .filter((flow) => value(flow) !== undefined && !Number.isNaN(value(flow)))
      .toSorted((a, b) => (value(b) ?? 0) - (value(a) ?? 0))[0];
  const headline = (
    label: string,
    flow: FlowReport | undefined,
    value: (flow: FlowReport) => number | undefined,
    unit: Headline["unit"],
    budget: Threshold,
  ): Headline => ({
    label,
    value: flow ? value(flow) : undefined,
    unit,
    budget,
    rating: rate(flow ? value(flow) : undefined, budget),
    detail: flow ? `worst: ${flow.title}` : "not measured",
  });
  const lcpFlow = worst(loadFlows, (flow) => flow.lcp?.median);
  const routeFlow = worst(interactionFlows, (flow) => flow.routeLCP?.median);
  const inpFlow = worst(interactionFlows, (flow) => flow.inp?.median);
  const clsFlow = worst(loadFlows, (flow) => flow.cls?.median);
  const slowestFlow = worst(interactionFlows, (flow) => flow.duration.median);
  const initialJS = bundles
    .filter((bundle) => bundle.type === "js" && bundle.isInitial)
    .reduce((sum, bundle) => sum + bundle.gzipBytes, 0);

  const headlines: Headline[] = [
    {
      ...headline(
        "LCP",
        lcpFlow,
        (flow) => flow.lcp?.median,
        "ms",
        budgets.LCP,
      ),
      detail: lcpFlow
        ? `worst: ${lcpFlow.title}; board painted at ${(lcpFlow.duration.median / 1000).toFixed(2)} s`
        : "not measured",
    },
    headline(
      "Worst route-change LCP",
      routeFlow,
      (flow) => flow.routeLCP?.median,
      "ms",
      budgets.routeLCP,
    ),
    headline("INP", inpFlow, (flow) => flow.inp?.median, "ms", budgets.INP),
    headline("CLS", clsFlow, (flow) => flow.cls?.median, "score", budgets.CLS),
    slowestFlow
      ? {
          label: "Slowest flow",
          value: slowestFlow.duration.median,
          unit: "ms",
          budget: slowestFlow.budget,
          rating: slowestFlow.rating,
          detail: slowestFlow.title,
        }
      : headline(
          "Slowest flow",
          undefined,
          () => undefined,
          "ms",
          budgets.spans.default,
        ),
    {
      label: "Total JS (gzip, initial)",
      value: initialJS,
      unit: "bytes",
      budget: budgets.totalJSGzipBytes,
      rating: rate(initialJS, budgets.totalJSGzipBytes),
      detail: `${bundles.filter((bundle) => bundle.isInitial && bundle.type === "js").length} chunks, production build`,
    },
  ];

  const summary: ResultSummary = {
    commit: meta.commit,
    date: meta.date,
    flows: Object.fromEntries(
      flows.map((flow) => [
        flow.id,
        { median: flow.duration.median, iqr: flow.duration.iqr },
      ]),
    ),
  };

  const relativeSpread = flows.map(
    (flow) => flow.duration.iqr / flow.duration.median,
  );
  const deltas = previous
    ? flows.flatMap((flow) => {
        const before = previous.flows[flow.id];
        return before
          ? [
              {
                flow: flow.title,
                delta:
                  Math.abs(flow.duration.median - before.median) /
                  before.median,
              },
            ]
          : [];
      })
    : [];
  const largestDelta = deltas.toSorted((a, b) => b.delta - a.delta)[0];

  return {
    meta,
    headlines,
    hotspots,
    flows,
    tables: {
      functions: functionRows
        .filter((row) => Number(row["Self median (ms)"]) >= MIN_TABLE_MS)
        .toSorted(
          (a, b) =>
            Number(b["Self median (ms)"]) - Number(a["Self median (ms)"]),
        )
        .slice(0, MAX_TABLE_ROWS),
      components: componentRows.toSorted(
        (a, b) =>
          Number(b["Duration median (ms)"]) - Number(a["Duration median (ms)"]),
      ),
      interactions: interactionRows.toSorted(
        (a, b) =>
          Number(b["Duration median (ms)"]) - Number(a["Duration median (ms)"]),
      ),
      frames: frameRows
        .toSorted(
          (a, b) =>
            Number(b["Duration median (ms)"]) -
            Number(a["Duration median (ms)"]),
        )
        .slice(0, MAX_TABLE_ROWS),
      requests: requestRows.toSorted(
        (a, b) =>
          Number(b["Duration median (ms)"]) - Number(a["Duration median (ms)"]),
      ),
      operations: operationRows,
      bundles: bundleRows.toSorted(
        (a, b) => Number(b["Gzip (KB)"]) - Number(a["Gzip (KB)"]),
      ),
    },
    variation: {
      withinRun: stat(relativeSpread).median,
      previous: largestDelta
        ? {
            label: previous
              ? `${previous.commit} (${previous.date.slice(0, 16).replace("T", " ")})`
              : "",
            median: stat(deltas.map((delta) => delta.delta)).median,
            max: largestDelta.delta,
            maxFlow: largestDelta.flow,
          }
        : undefined,
    },
    summary,
  };
}
