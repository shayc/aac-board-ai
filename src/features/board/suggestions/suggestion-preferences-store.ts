import { createPersistedStore } from "@shared/state/persisted-store";
import { useSyncExternalStore } from "react";

interface SuggestionPreferences {
  customInstructions: string;
}

export function parseSuggestionPreferences(
  raw: unknown,
): SuggestionPreferences {
  const stored = (raw ?? {}) as Record<string, unknown>;

  return {
    customInstructions:
      typeof stored.customInstructions === "string"
        ? stored.customInstructions
        : "",
  };
}

const suggestionPreferencesStore = createPersistedStore<SuggestionPreferences>(
  "suggestion-preferences",
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
