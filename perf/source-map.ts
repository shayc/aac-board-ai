import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const BASE64_DIGITS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const IDENTIFIER_CHARACTER = /[\w$]/;
const NAME_SEARCH_DISTANCE = 32;

export type ScriptPosition =
  | { offset: number }
  | { line: number; column: number };

interface RawSourceMap {
  sources: string[];
  names: string[];
  mappings: string;
}

interface Segment {
  offset: number;
  original?: { source: number; line: number; name?: number };
}

interface ChunkSourceMap {
  code: string;
  lineStarts: number[];
  segments: Segment[];
  sources: string[];
  names: string[];
}

const chunkSourceMaps = new Map<string, ChunkSourceMap | undefined>();

export function describeFunction(
  url: string,
  functionName: string,
  position: ScriptPosition,
): string {
  const builtName = `${chunkName(url)} · ${functionName || "(anonymous)"}`;
  const sourceMap = loadSourceMap(url);
  if (!sourceMap) {
    return builtName;
  }

  const offset = toOffset(sourceMap, position);
  const index = findSegment(sourceMap.segments, offset);
  const original = sourceMap.segments[index]?.original;
  if (!original) {
    return builtName;
  }

  const file = sourceMap.sources[original.source];
  const name =
    originalName(sourceMap, index, offset, functionName) ?? "(anonymous)";

  return `${file}:${original.line + 1} · ${name}`;
}

function chunkName(url: string): string {
  return URL.parse(url)?.pathname.slice(1) || "(inline)";
}

function toOffset(sourceMap: ChunkSourceMap, position: ScriptPosition): number {
  if ("offset" in position) {
    return position.offset;
  }

  return (sourceMap.lineStarts[position.line] ?? Number.NaN) + position.column;
}

function originalName(
  { code, segments, names }: ChunkSourceMap,
  index: number,
  offset: number,
  functionName: string,
): string | undefined {
  const minifiedName = /[\w$]+$/.exec(functionName)?.[0];
  if (!minifiedName) {
    return undefined;
  }

  for (let candidate = index; candidate >= 0; candidate -= 1) {
    const segment = segments[candidate];
    if (!segment || segment.offset < offset - NAME_SEARCH_DISTANCE) {
      break;
    }

    const nameIndex = segment.original?.name;
    const name = nameIndex === undefined ? undefined : names[nameIndex];
    if (
      name &&
      IDENTIFIER.test(name) &&
      isNameAt(code, minifiedName, segment.offset)
    ) {
      return name;
    }
  }

  const isPropertyName = functionName.includes(".");

  return isPropertyName ? minifiedName : undefined;
}

function isNameAt(code: string, name: string, offset: number): boolean {
  return (
    code.startsWith(name, offset) &&
    !IDENTIFIER_CHARACTER.test(code[offset + name.length] ?? "")
  );
}

function loadSourceMap(url: string): ChunkSourceMap | undefined {
  if (!chunkSourceMaps.has(url)) {
    chunkSourceMaps.set(url, readSourceMap(url));
  }

  return chunkSourceMaps.get(url);
}

function readSourceMap(url: string): ChunkSourceMap | undefined {
  const pathname = URL.parse(url)?.pathname;
  if (!pathname) {
    return undefined;
  }

  const file = path.join(DIST_DIR, pathname);
  let code: string;
  let sourceMap: RawSourceMap;
  try {
    code = readFileSync(file, "utf8");
    sourceMap = JSON.parse(readFileSync(`${file}.map`, "utf8")) as RawSourceMap;
  } catch {
    return undefined;
  }

  const lineStarts = findLineStarts(code);

  return {
    code,
    lineStarts,
    segments: decodeMappings(sourceMap.mappings, lineStarts),
    sources: sourceMap.sources.map((source) =>
      path.relative(ROOT_DIR, path.resolve(path.dirname(file), source)),
    ),
    names: sourceMap.names,
  };
}

function findLineStarts(code: string): number[] {
  const starts = [0];
  for (
    let index = code.indexOf("\n");
    index !== -1;
    index = code.indexOf("\n", index + 1)
  ) {
    starts.push(index + 1);
  }

  return starts;
}

function decodeMappings(mappings: string, lineStarts: number[]): Segment[] {
  const segments: Segment[] = [];
  let source = 0;
  let line = 0;
  let name = 0;

  mappings.split(";").forEach((lineMappings, generatedLine) => {
    let column = 0;

    for (const field of lineMappings.split(",")) {
      if (field === "") {
        continue;
      }

      const [columnDelta = 0, sourceDelta, lineDelta = 0, , nameDelta] =
        decodeVLQ(field);
      column += columnDelta;
      const offset = (lineStarts[generatedLine] ?? 0) + column;

      if (sourceDelta === undefined) {
        segments.push({ offset });
        continue;
      }

      source += sourceDelta;
      line += lineDelta;
      if (nameDelta === undefined) {
        segments.push({ offset, original: { source, line } });
        continue;
      }

      name += nameDelta;
      segments.push({ offset, original: { source, line, name } });
    }
  });

  return segments;
}

function decodeVLQ(field: string): number[] {
  const values: number[] = [];
  let value = 0;
  let shift = 0;

  for (const character of field) {
    const digit = BASE64_DIGITS.indexOf(character);
    value += (digit & 31) << shift;

    if (digit & 32) {
      shift += 5;
      continue;
    }

    values.push(value & 1 ? -(value >>> 1) : value >>> 1);
    value = 0;
    shift = 0;
  }

  return values;
}

function findSegment(segments: Segment[], offset: number): number {
  let low = 0;
  let high = segments.length - 1;
  let found = -1;

  while (low <= high) {
    const middle = (low + high) >>> 1;
    if ((segments[middle]?.offset ?? Infinity) <= offset) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return found;
}
