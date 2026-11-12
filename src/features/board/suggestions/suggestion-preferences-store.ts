import { patchState, useExternalStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { isRecord } from "@shared/utils/is-record";

interface SuggestionPreferences {
  customInstructions: string;
}

export function parseSuggestionPreferences(
  raw: unknown,
): SuggestionPreferences {
  const stored: Record<string, unknown> = isRecord(raw) ? raw : {};

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
  patchState(suggestionPreferencesStore, { customInstructions });
}

export function useSuggestionPreferences(): SuggestionPreferences {
  return useExternalStore(suggestionPreferencesStore);
}
