import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { readHotFunctions } from "./cpu-profile.ts";
import { ROOT_DIR } from "./results.ts";

const ORIGIN = "http://127.0.0.1:4173";
const MAIN_THREAD = { pid: 1, tid: 2 };
const WORKER_THREAD = { pid: 1, tid: 9 };

// Built from src/app/layout.ts:
//   export function computeLayout() {
//     return 1;
//   }
const CHUNK = "function a(){return 1}";
const SOURCE_MAP = {
  version: 3,
  sources: ["../../src/app/layout.ts"],
  names: ["computeLayout"],
  mappings: "AAAO,SAASA,IACd",
};

const fixtureDir = await mkdtemp(path.join(os.tmpdir(), "perf-cpu-profile-"));
const distDir = path.join(fixtureDir, "dist");

after(async () => {
  await rm(fixtureDir, { recursive: true, force: true });
});

function callFrame(file: string, functionName: string, columnNumber: number) {
  return {
    url: `${ORIGIN}/${file}`,
    functionName,
    lineNumber: 0,
    columnNumber,
  };
}

function profileEvents(
  thread: { pid: number; tid: number },
  id: string,
  nodes: unknown[],
  samples: number[],
  timeDeltas: number[],
) {
  return [
    { name: "Profile", ...thread, id, args: {} },
    {
      name: "ProfileChunk",
      ...thread,
      id,
      args: { data: { cpuProfile: { nodes, samples }, timeDeltas } },
    },
  ];
}

async function writeTrace(): Promise<string> {
  const root = { id: 1, callFrame: { functionName: "(root)" } };
  const computeLayout = {
    id: 2,
    parent: 1,
    callFrame: callFrame("assets/app.js", "a", 10),
  };
  const nativeCall = {
    id: 3,
    parent: 2,
    callFrame: { functionName: "appendChild" },
  };
  const unmapped = {
    id: 4,
    parent: 1,
    callFrame: callFrame("assets/missing.js", "b", 0),
  };

  const trace = {
    traceEvents: [
      {
        name: "thread_name",
        ...MAIN_THREAD,
        args: { name: "CrRendererMain" },
      },
      {
        name: "thread_name",
        ...WORKER_THREAD,
        args: { name: "DedicatedWorker thread" },
      },
      ...profileEvents(
        MAIN_THREAD,
        "0x1",
        [root, computeLayout, nativeCall, unmapped],
        [2, 3, 2, 4, 1],
        [0, 1000, 2000, 500, 250],
      ),
      ...profileEvents(
        WORKER_THREAD,
        "0x2",
        [root, computeLayout],
        [2, 2],
        [0, 9000],
      ),
    ],
  };

  const file = path.join(fixtureDir, "phase.trace.json");
  await writeFile(file, JSON.stringify(trace));

  return file;
}

await mkdir(path.join(distDir, "assets"), { recursive: true });
await writeFile(path.join(distDir, "assets/app.js"), CHUNK);
await writeFile(
  path.join(distDir, "assets/app.js.map"),
  JSON.stringify(SOURCE_MAP),
);

await test("readHotFunctions names main-thread functions by source and sums their self time", async () => {
  const sourceFile = path.relative(
    ROOT_DIR,
    path.join(fixtureDir, "src/app/layout.ts"),
  );

  assert.deepEqual(await readHotFunctions(await writeTrace(), distDir, 10), [
    { function: `${sourceFile}:1 · computeLayout`, selfMs: 3.5 },
    { function: "assets/missing.js · b", selfMs: 0.25 },
  ]);
});

await test("readHotFunctions keeps only the requested number of functions", async () => {
  const hotFunctions = await readHotFunctions(await writeTrace(), distDir, 1);

  assert.equal(hotFunctions.length, 1);
  assert.equal(hotFunctions[0]?.selfMs, 3.5);
});
