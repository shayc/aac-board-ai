import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

interface BoardSuggestionConfig {
  customInstructions: string;
}

export function parseBoardSuggestionConfig(
  raw: unknown,
): BoardSuggestionConfig {
  const parsed = (raw ?? {}) as Record<string, unknown>;

  return {
    customInstructions:
      typeof parsed.customInstructions === "string"
        ? parsed.customInstructions
        : "",
  };
}

const suggestionConfigStore = createPersistedStore<BoardSuggestionConfig>(
  "board-suggestions",
  parseBoardSuggestionConfig,
);

export function setSuggestionCustomInstructions(
  customInstructions: string,
): void {
  suggestionConfigStore.setState({
    ...suggestionConfigStore.getSnapshot(),
    customInstructions,
  });
}

export function useBoardSuggestionConfig(): BoardSuggestionConfig {
  return useSyncExternalStore(
    suggestionConfigStore.subscribe,
    suggestionConfigStore.getSnapshot,
  );
}
