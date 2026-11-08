import { useExternalStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { parseBoolean } from "@shared/utils/parse-boolean";

interface MessagePreferences {
  areImagesVisible: boolean;
  isHighlightingEnabled: boolean;
}

export function parseMessagePreferences(raw: unknown): MessagePreferences {
  const stored = (raw ?? {}) as Record<string, unknown>;

  return {
    areImagesVisible: parseBoolean(stored.areImagesVisible, true),
    isHighlightingEnabled: parseBoolean(stored.isHighlightingEnabled, true),
  };
}

const messagePreferencesStore = createPersistedStore<MessagePreferences>(
  "message-preferences",
  parseMessagePreferences,
);

function updatePreferences(patch: Partial<MessagePreferences>): void {
  messagePreferencesStore.setState((preferences) => ({
    ...preferences,
    ...patch,
  }));
}

export function setMessageImagesVisible(areImagesVisible: boolean): void {
  updatePreferences({ areImagesVisible });
}

export function setMessageHighlightingEnabled(
  isHighlightingEnabled: boolean,
): void {
  updatePreferences({ isHighlightingEnabled });
}

export function useMessagePreferences(): MessagePreferences {
  return useExternalStore(messagePreferencesStore);
}
