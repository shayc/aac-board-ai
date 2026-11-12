import { isSupported } from "@shayc/react-built-in-ai";

export const SUGGESTION_ENGINES = ["Proofreader", "Rewriter"] as const;

export function areSuggestionsSupported(): boolean {
  return SUGGESTION_ENGINES.some((engine) => isSupported(engine));
}

export function areCustomInstructionsSupported(): boolean {
  return isSupported("Rewriter");
}
