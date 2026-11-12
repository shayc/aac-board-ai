import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { gzip } from "node:zlib";

const BYTES_PER_KILOBYTE = 1000;

export async function hashBuild(distDir: string): Promise<string> {
  const hash = createHash("sha256");
  for (const file of await listFiles(distDir)) {
    hash.update(path.relative(distDir, file));
    hash.update(await readFile(file));
  }

  return hash.digest("hex").slice(0, 12);
}

/** Kilobytes of every script the build ships, gzipped as a static host serves them. */
export async function measureJSShipped(distDir: string): Promise<number> {
  const scripts = (await listFiles(distDir)).filter((file) =>
    file.endsWith(".js"),
  );
  const compressed = await Promise.all(
    scripts.map(async (file) => promisify(gzip)(await readFile(file))),
  );
  const bytes = compressed.reduce((total, script) => total + script.length, 0);

  return bytes / BYTES_PER_KILOBYTE;
}

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .toSorted();
}
