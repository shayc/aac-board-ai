import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { gzipSync } from "node:zlib";
import { hashBuild, measureJSShipped } from "./dist.ts";

const SCRIPT = "export const greeting = 'hello';\n".repeat(50);

async function withBuild(
  files: Record<string, string>,
  check: (distDir: string) => Promise<void>,
): Promise<void> {
  const distDir = await mkdtemp(path.join(os.tmpdir(), "perf-dist-"));

  try {
    for (const [file, contents] of Object.entries(files)) {
      await mkdir(path.dirname(path.join(distDir, file)), { recursive: true });
      await writeFile(path.join(distDir, file), contents);
    }
    await check(distDir);
  } finally {
    await rm(distDir, { recursive: true, force: true });
  }
}

await test("measureJSShipped adds up the gzipped scripts at any depth", async () => {
  await withBuild(
    { "sw.js": SCRIPT, "assets/index.js": SCRIPT },
    async (distDir) => {
      assert.equal(
        await measureJSShipped(distDir),
        (gzipSync(SCRIPT).length * 2) / 1000,
      );
    },
  );
});

await test("measureJSShipped leaves out everything that is not a script", async () => {
  await withBuild(
    { "index.html": SCRIPT, "assets/board.obz": SCRIPT },
    async (distDir) => {
      assert.equal(await measureJSShipped(distDir), 0);
    },
  );
});

await test("hashBuild changes with a file's contents and with its path", async () => {
  const hashes = new Set<string>();
  const builds: Record<string, string>[] = [
    { "index.js": "a" },
    { "index.js": "b" },
    { "other.js": "a" },
  ];
  for (const files of builds) {
    await withBuild(files, async (distDir) => {
      hashes.add(await hashBuild(distDir));
    });
  }

  assert.equal(hashes.size, 3);
});
