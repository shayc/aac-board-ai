import type { Scorecard } from "./scorecard.ts";

export type BuildName = "base" | "current";

/**
 * Milliseconds per round for each build; the same index is the same round.
 * A build that was not measured has no samples.
 */
export type TimingSamples = Record<BuildName, number[]>;

export interface RunSettings {
  browserVersion: string;
  cpuSlowdown: number;
  roundCount: number;
}

export interface JourneyResult {
  journey: string;
  settings: RunSettings;
  timings: Record<string, TimingSamples>;
}

export interface BuildInfo {
  source: string;
  commit: string;
  buildHash: string;
}

export interface RunResults {
  date: string;
  settings: RunSettings;
  builds: Record<BuildName, BuildInfo>;
  journeys: JourneyResult[];
}

export interface XrayResults extends Scorecard {
  date: string;
  settings: RunSettings;
  build: BuildInfo;
}
