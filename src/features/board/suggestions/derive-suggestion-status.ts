import type { Status } from "@shayc/react-built-in-ai";

export type SuggestionDisplayState =
  | { kind: "needs-setup" }
  | { kind: "downloading"; percent: number | null }
  | { kind: "pending" }
  | { kind: "unavailable" }
  | null;

interface EngineCondition {
  status: Status;
  requestFailed: boolean;
}

export interface SuggestionStatusInput {
  engines: readonly EngineCondition[];
  downloadProgress: number | null;
  hasText: boolean;
  isPending: boolean;
  phraseCount: number;
}

export function deriveSuggestionStatus({
  engines,
  downloadProgress,
  hasText,
  isPending,
  phraseCount,
}: SuggestionStatusInput): SuggestionDisplayState {
  const supported = engines.filter(({ status }) => status !== "unsupported");
  if (supported.length === 0) {
    return null;
  }

  if (supported.some(({ status }) => status === "downloadable")) {
    return { kind: "needs-setup" };
  }

  if (downloadProgress !== null) {
    const percent = Math.round(downloadProgress * 100);
    return { kind: "downloading", percent: percent === 0 ? null : percent };
  }

  if (isPending) {
    return { kind: "pending" };
  }

  // A healthy engine that merely had nothing to suggest keeps the bar quiet.
  const hasWorkingEngine = supported.some(
    ({ status, requestFailed }) =>
      status !== "unavailable" && status !== "error" && !requestFailed,
  );
  if (hasText && phraseCount === 0 && !hasWorkingEngine) {
    return { kind: "unavailable" };
  }

  return null;
}
