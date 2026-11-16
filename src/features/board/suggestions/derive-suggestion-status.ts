import type { Status } from "@shayc/react-built-in-ai";
import type { SuggestionSource } from "./suggestion-source";
import { isEngineStatusAvailable } from "./suggestion-support";

export type SuggestionStatus =
  | { kind: "idle" }
  | { kind: "not-enabled" }
  | { kind: "downloading"; percent: number | null }
  | { kind: "pending" }
  | { kind: "failed" };

export interface SuggestionStatusInput {
  sources: readonly Pick<
    SuggestionSource,
    "engineStatus" | "isRequestPending" | "hasRequestFailed"
  >[];
  downloadProgress: number | null;
  hasText: boolean;
  phraseCount: number;
}

export function deriveSuggestionStatus({
  sources,
  downloadProgress,
  hasText,
  phraseCount,
}: SuggestionStatusInput): SuggestionStatus {
  const availableSources = sources.filter(({ engineStatus }) =>
    isEngineStatusAvailable(engineStatus),
  );
  if (availableSources.length === 0) {
    return { kind: "idle" };
  }

  // Engines in error require an explicit prepare() retry.
  if (
    availableSources.some(({ engineStatus }) => needsEnabling(engineStatus))
  ) {
    return { kind: "not-enabled" };
  }

  if (downloadProgress !== null) {
    const percent = Math.round(downloadProgress * 100);

    return { kind: "downloading", percent: percent === 0 ? null : percent };
  }

  if (availableSources.some(({ isRequestPending }) => isRequestPending)) {
    return { kind: "pending" };
  }

  const hasWorkingSource = availableSources.some(
    ({ hasRequestFailed }) => !hasRequestFailed,
  );
  if (hasText && phraseCount === 0 && !hasWorkingSource) {
    return { kind: "failed" };
  }

  return { kind: "idle" };
}

function needsEnabling(engineStatus: Status): boolean {
  return engineStatus === "downloadable" || engineStatus === "error";
}
