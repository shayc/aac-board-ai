import type { EngineView } from "@shared/built-in-ai/engine-view";

export type SuggestionStatusView =
  | { kind: "needs-activation" }
  | { kind: "downloading"; progress: number }
  | { kind: "pending" }
  | { kind: "unavailable" }
  | null;

export interface EngineCondition {
  view: EngineView;
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
  const supported = engines.filter(({ view }) => view.kind !== "unsupported");
  if (supported.length === 0) {
    return null;
  }

  if (supported.some(({ view }) => view.kind === "awaits-gesture")) {
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
    ({ view, requestFailed }) => view.kind !== "unavailable" && !requestFailed,
  );
  if (hasText && phraseCount === 0 && !hasWorkingEngine) {
    return { kind: "unavailable" };
  }

  return null;
}
