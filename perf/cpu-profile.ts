import { readFile } from "node:fs/promises";
import type { HotFunction } from "./results.ts";
import { describeFunction } from "./source-map.ts";

interface ProfileNode {
  id: number;
  parent?: number;
  callFrame: {
    url?: string;
    functionName: string;
    lineNumber?: number;
    columnNumber?: number;
  };
}

interface TraceEvent {
  name: string;
  pid: number;
  tid: number;
  id?: string;
  args: {
    name?: string;
    data?: {
      cpuProfile?: { nodes?: ProfileNode[]; samples?: number[] };
      timeDeltas?: number[];
    };
  };
}

interface ThreadProfile {
  nodes: Map<number, ProfileNode>;
  samples: number[];
  timeDeltas: number[];
}

export async function readHotFunctions(
  traceFile: string,
  distDir: string,
  count: number,
): Promise<HotFunction[]> {
  const microsecondsByFunction = new Map<string, number>();

  for (const profile of await readMainThreadProfiles(traceFile)) {
    profile.samples.forEach((nodeId, index) => {
      const caller = describePageCaller(profile.nodes, nodeId, distDir);
      if (!caller) {
        return;
      }

      const microsecondsUntilNextSample = profile.timeDeltas[index + 1] ?? 0;
      microsecondsByFunction.set(
        caller,
        (microsecondsByFunction.get(caller) ?? 0) + microsecondsUntilNextSample,
      );
    });
  }

  return [...microsecondsByFunction]
    .map(([caller, microseconds]) => ({
      function: caller,
      selfMs: microseconds / 1000,
    }))
    .toSorted((a, b) => b.selfMs - a.selfMs)
    .slice(0, count);
}

async function readMainThreadProfiles(
  traceFile: string,
): Promise<ThreadProfile[]> {
  const { traceEvents } = JSON.parse(await readFile(traceFile, "utf8")) as {
    traceEvents: TraceEvent[];
  };
  const mainThreads = new Set(
    traceEvents
      .filter(
        ({ name, args }) =>
          name === "thread_name" && args.name === "CrRendererMain",
      )
      .map(({ pid, tid }) => `${pid}:${tid}`),
  );

  const profiles = new Map<string, ThreadProfile>();
  for (const { name, pid, tid, id, args } of traceEvents) {
    if (name === "Profile" && mainThreads.has(`${pid}:${tid}`)) {
      profiles.set(`${pid}:${id}`, {
        nodes: new Map(),
        samples: [],
        timeDeltas: [],
      });
    }

    const profile = profiles.get(`${pid}:${id}`);
    if (name !== "ProfileChunk" || !profile) {
      continue;
    }

    for (const node of args.data?.cpuProfile?.nodes ?? []) {
      profile.nodes.set(node.id, node);
    }
    profile.samples.push(...(args.data?.cpuProfile?.samples ?? []));
    profile.timeDeltas.push(...(args.data?.timeDeltas ?? []));
  }

  return [...profiles.values()];
}

function describePageCaller(
  nodes: Map<number, ProfileNode>,
  nodeId: number,
  distDir: string,
): string | undefined {
  for (
    let node = nodes.get(nodeId);
    node;
    node = node.parent === undefined ? undefined : nodes.get(node.parent)
  ) {
    const {
      url,
      functionName,
      lineNumber = -1,
      columnNumber = -1,
    } = node.callFrame;
    if (url && /^https?:/.test(url)) {
      return describeFunction(
        distDir,
        url,
        functionName,
        lineNumber,
        columnNumber,
      );
    }
  }

  return undefined;
}
