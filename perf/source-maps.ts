import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

export interface SourceLocation {
  source: string;
  line: number;
  name?: string;
}

interface RawSourceMap {
  sources: string[];
  names: string[];
  mappings: string;
}

type Segment = [
  column: number,
  sourceIndex: number,
  line: number,
  sourceColumn: number,
  nameIndex?: number,
];

interface ParsedSourceMap {
  sources: string[];
  names: string[];
  lines: Segment[][];
}

const BASE64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const NAME_SEARCH_COLUMNS = 120;

function decodeVLQ(field: string): number[] {
  const values: number[] = [];
  let value = 0;
  let shift = 0;

  for (const character of field) {
    const digit = BASE64.indexOf(character);
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

function parseMappings(mappings: string): Segment[][] {
  const state = [0, 0, 0, 0];

  return mappings.split(";").map((line) => {
    let column = 0;

    return line
      .split(",")
      .filter(Boolean)
      .map((field) => {
        const [columnDelta, ...rest] = decodeVLQ(field);
        column += columnDelta;
        rest.forEach((delta, index) => {
          state[index] += delta;
        });

        return (
          rest.length === 4
            ? [column, state[0], state[1], state[2], state[3]]
            : [column, state[0], state[1], state[2]]
        ) as Segment;
      });
  });
}

function shortenSource(path: string): string {
  const packageIndex = path.lastIndexOf("node_modules/");

  return packageIndex === -1 ? path : path.slice(packageIndex);
}

export class SourceMaps {
  private readonly maps = new Map<string, ParsedSourceMap | undefined>();
  private readonly files = new Map<
    string,
    { text: string; starts: number[] }
  >();
  private readonly buildDir: string;
  private readonly rootDir: string;

  constructor(buildDir: string, rootDir: string) {
    this.buildDir = buildDir;
    this.rootDir = rootDir;
  }

  private load(file: string): ParsedSourceMap | undefined {
    if (this.maps.has(file)) {
      return this.maps.get(file);
    }

    const mapPath = join(this.buildDir, `${file}.map`);
    const parsed = existsSync(mapPath) ? this.parse(mapPath) : undefined;
    this.maps.set(file, parsed);

    return parsed;
  }

  private parse(mapPath: string): ParsedSourceMap {
    const raw = JSON.parse(readFileSync(mapPath, "utf8")) as RawSourceMap;
    const mapDir = dirname(mapPath);

    return {
      sources: raw.sources.map((source) =>
        shortenSource(relative(this.rootDir, resolve(mapDir, source))),
      ),
      names: raw.names,
      lines: parseMappings(raw.mappings),
    };
  }

  static assetFile(url: string): string | undefined {
    const match = /\/(assets\/[^/?#]+\.js)/.exec(url);

    return match?.[1];
  }

  lookup(
    url: string,
    line: number,
    column: number,
  ): SourceLocation | undefined {
    const file = SourceMaps.assetFile(url);
    const map = file ? this.load(file) : undefined;
    const segments = map?.lines[line];
    if (!map || !segments || segments.length === 0) {
      return undefined;
    }

    const index = Math.max(
      0,
      segments.findLastIndex((segment) => segment[0] <= column),
    );
    const [, sourceIndex, sourceLine] = segments[index];

    return {
      source: map.sources[sourceIndex] ?? "(unknown)",
      line: sourceLine + 1,
    };
  }

  lookupFunction(
    url: string,
    line: number,
    column: number,
    minifiedName: string,
  ): SourceLocation | undefined {
    const location = this.lookup(url, line, column);
    const file = SourceMaps.assetFile(url);
    const map = file ? this.load(file) : undefined;
    if (!location || !file || !map || !minifiedName) {
      return location;
    }

    const { text, starts } = this.fileOf(file);
    const lineStart = starts[line] ?? 0;
    const nameSegment = (map.lines[line] ?? [])
      .filter(
        (segment) =>
          segment[4] !== undefined &&
          Math.abs(segment[0] - column) <= NAME_SEARCH_COLUMNS &&
          text.startsWith(minifiedName, lineStart + segment[0]),
      )
      .toSorted((a, b) => Math.abs(a[0] - column) - Math.abs(b[0] - column))[0];

    return {
      ...location,
      name:
        nameSegment?.[4] === undefined
          ? minifiedName
          : map.names[nameSegment[4]],
    };
  }

  lookupCharPosition(
    url: string,
    charPosition: number,
    minifiedName: string,
  ): SourceLocation | undefined {
    const file = SourceMaps.assetFile(url);
    if (!file || charPosition < 0) {
      return undefined;
    }

    const { starts } = this.fileOf(file);
    const line = Math.max(
      0,
      starts.findLastIndex((start) => start <= charPosition),
    );

    return this.lookupFunction(
      url,
      line,
      charPosition - (starts[line] ?? 0),
      minifiedName,
    );
  }

  private fileOf(file: string): { text: string; starts: number[] } {
    const cached = this.files.get(file);
    if (cached) {
      return cached;
    }

    const path = join(this.buildDir, file);
    const text = existsSync(path) ? readFileSync(path, "utf8") : "";
    const starts = [0];
    for (let index = 0; index < text.length; index += 1) {
      if (text.charCodeAt(index) === 10) {
        starts.push(index + 1);
      }
    }
    const parsed = { text, starts };
    this.files.set(file, parsed);

    return parsed;
  }
}
