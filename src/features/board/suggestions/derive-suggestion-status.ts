import type { Status } from "@shayc/react-built-in-ai";

export type SuggestionStatusView =
  | { kind: "needs-activation" }
  | { kind: "downloading"; progress: number }
  | { kind: "pending" }
  | { kind: "unavailable" }
  | null;

export interface EngineCondition {
  status: Status;
  requestFailed: boolean;
}

export interface SuggestionStatusInput {
  engines: EngineCondition[];
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
}: SuggestionStatusInput): SuggestionStatusView {
  const supported = engines.filter(({ status }) => status !== "unsupported");
  if (supported.length === 0) {
    return null;
  }

  if (supported.some(({ status }) => status === "downloadable")) {
    return { kind: "needs-activation" };
  }

  if (downloadProgress !== null) {
    return { kind: "downloading", progress: downloadProgress };
  }

  if (isPending && phraseCount === 0) {
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
