import { patchState, useExternalStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { isRecord } from "@shared/utils/is-record";
import { parseBoolean } from "@shared/utils/parse-boolean";

interface MessagePreferences {
  areImagesVisible: boolean;
  isHighlightingEnabled: boolean;
}

export function parseMessagePreferences(raw: unknown): MessagePreferences {
  const stored: Record<string, unknown> = isRecord(raw) ? raw : {};

  return {
    areImagesVisible: parseBoolean(stored.areImagesVisible, true),
    isHighlightingEnabled: parseBoolean(stored.isHighlightingEnabled, true),
  };
}

const messagePreferencesStore = createPersistedStore<MessagePreferences>(
  "message-preferences",
  parseMessagePreferences,
);

export function setMessageImagesVisible(areImagesVisible: boolean): void {
  patchState(messagePreferencesStore, { areImagesVisible });
}

export function setMessageHighlightingEnabled(
  isHighlightingEnabled: boolean,
): void {
  patchState(messagePreferencesStore, { isHighlightingEnabled });
}

export function useMessagePreferences(): MessagePreferences {
  return useExternalStore(messagePreferencesStore);
}
