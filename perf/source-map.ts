import { readFileSync } from "node:fs";
import { SourceMap, type SourceMapPayload } from "node:module";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const NAME_SEARCH_DISTANCE = 32;

interface Chunk {
  file: string;
  lines: string[];
  sourceMap: SourceMap;
}

const chunks = new Map<string, Chunk | undefined>();

export function describeFunction(
  url: string,
  functionName: string,
  line: number,
  column: number,
): string {
  const builtName = `${chunkName(url)} · ${functionName || "(anonymous)"}`;
  const chunk = loadChunk(url);
  const origin = chunk?.sourceMap.findOrigin(line + 1, column + 1);
  if (!chunk || !origin || !("fileName" in origin)) {
    return builtName;
  }

  const file = path.relative(
    ROOT_DIR,
    path.resolve(path.dirname(chunk.file), origin.fileName),
  );
  const name = originalName(chunk, line, column, functionName) ?? "(anonymous)";

  return `${file}:${origin.lineNumber} · ${name}`;
}

function chunkName(url: string): string {
  return URL.parse(url)?.pathname.slice(1) || "(inline)";
}

function originalName(
  { lines, sourceMap }: Chunk,
  line: number,
  column: number,
  functionName: string,
): string | undefined {
  const minifiedName = /[\w$]+$/.exec(functionName)?.[0];
  if (!minifiedName) {
    return undefined;
  }

  const searchStart = Math.max(0, column - NAME_SEARCH_DISTANCE);
  const before = (lines[line] ?? "").slice(searchStart, column);
  const nameMatch = [...before.matchAll(/[\w$]+/g)].findLast(
    ([identifier]) => identifier === minifiedName,
  );
  if (nameMatch) {
    const origin = sourceMap.findOrigin(
      line + 1,
      searchStart + nameMatch.index + 1,
    );
    if ("name" in origin && origin.name) {
      return origin.name;
    }
  }

  const isPropertyName = functionName.includes(".");

  return isPropertyName ? minifiedName : undefined;
}

function loadChunk(url: string): Chunk | undefined {
  if (!chunks.has(url)) {
    chunks.set(url, readChunk(url));
  }

  return chunks.get(url);
}

function readChunk(url: string): Chunk | undefined {
  const pathname = URL.parse(url)?.pathname;
  if (!pathname) {
    return undefined;
  }

  const file = path.join(DIST_DIR, pathname);
  try {
    return {
      file,
      lines: readFileSync(file, "utf8").split("\n"),
      sourceMap: new SourceMap(
        JSON.parse(readFileSync(`${file}.map`, "utf8")) as SourceMapPayload,
      ),
    };
  } catch {
    return undefined;
  }
}
