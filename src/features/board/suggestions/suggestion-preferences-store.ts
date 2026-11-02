import { createPersistedStore } from "@shared/state/persisted-store";
import { useSyncExternalStore } from "react";

interface SuggestionPreferences {
  customInstructions: string;
}

export function parseSuggestionPreferences(
  raw: unknown,
): SuggestionPreferences {
  const parsed = (raw ?? {}) as Record<string, unknown>;

  return {
    customInstructions:
      typeof parsed.customInstructions === "string"
        ? parsed.customInstructions
        : "",
  };
}

const suggestionPreferencesStore = createPersistedStore<SuggestionPreferences>(
  "board-suggestions",
  parseSuggestionPreferences,
);

export function setSuggestionCustomInstructions(
  customInstructions: string,
): void {
  suggestionPreferencesStore.setState({
    ...suggestionPreferencesStore.getSnapshot(),
    customInstructions,
  });
}

export function useSuggestionPreferences(): SuggestionPreferences {
  return useSyncExternalStore(
    suggestionPreferencesStore.subscribe,
    suggestionPreferencesStore.getSnapshot,
  );
}
