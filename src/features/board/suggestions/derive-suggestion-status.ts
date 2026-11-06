import type { SuggestionSource } from "./suggestion-source";

export type SuggestionStatus =
  | { kind: "not-enabled" }
  | { kind: "downloading"; percent: number | null }
  | { kind: "pending" }
  | { kind: "unavailable" }
  | null;

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
  const supportedSources = sources.filter(
    ({ engineStatus }) => engineStatus !== "unsupported",
  );
  if (supportedSources.length === 0) {
    return null;
  }

  if (
    supportedSources.some(({ engineStatus }) => engineStatus === "downloadable")
  ) {
    return { kind: "not-enabled" };
  }

  if (downloadProgress !== null) {
    const percent = Math.round(downloadProgress * 100);
    return { kind: "downloading", percent: percent === 0 ? null : percent };
  }

  if (supportedSources.some(({ isRequestPending }) => isRequestPending)) {
    return { kind: "pending" };
  }

  // A working source that merely had nothing to suggest keeps the bar quiet.
  const hasWorkingSource = supportedSources.some(
    ({ engineStatus, hasRequestFailed }) =>
      engineStatus !== "unavailable" &&
      engineStatus !== "error" &&
      !hasRequestFailed,
  );
  if (hasText && phraseCount === 0 && !hasWorkingSource) {
    return { kind: "unavailable" };
  }

  return null;
}
