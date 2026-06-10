import type { EngineView } from "./use-suggestion-engine";

export type SuggestionStatusView =
  | { kind: "needs-activation" }
  | { kind: "downloading"; progress: number }
  | { kind: "pending" }
  | { kind: "unavailable" }
  | null;

export interface EngineCondition {
  view: EngineView;
  roundFailed: boolean;
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
  const present = engines.filter(({ view }) => view.kind !== "unsupported");
  if (present.length === 0) {
    return null;
  }

  if (present.some(({ view }) => view.kind === "awaits-gesture")) {
    return { kind: "needs-activation" };
  }

  if (downloadProgress !== null) {
    return { kind: "downloading", progress: downloadProgress };
  }

  if (isPending && phraseCount === 0) {
    return { kind: "pending" };
  }

  // A healthy engine that merely had nothing to suggest keeps the bar quiet.
  const hasWorkingEngine = present.some(
    ({ view, roundFailed }) => view.kind !== "unavailable" && !roundFailed,
  );
  if (hasText && phraseCount === 0 && !hasWorkingEngine) {
    return { kind: "unavailable" };
  }

  return null;
}
