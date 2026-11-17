import { patchState, useExternalStore } from "@shared/stores/external-store";
import { createPersistedStore } from "@shared/stores/persisted-store";
import { isRecord } from "@shared/utils/is-record";
import { parseBoolean } from "@shared/utils/parse-boolean";

interface MessagePreferences {
  areImagesVisible: boolean;
  isHighlightingEnabled: boolean;
  shouldClearAfterPlayback: boolean;
  shouldPlayTiles: boolean;
}

export function parseMessagePreferences(raw: unknown): MessagePreferences {
  const stored: Record<string, unknown> = isRecord(raw) ? raw : {};

  return {
    areImagesVisible: parseBoolean(stored.areImagesVisible, true),
    isHighlightingEnabled: parseBoolean(stored.isHighlightingEnabled, true),
    shouldClearAfterPlayback: parseBoolean(
      stored.shouldClearAfterPlayback,
      true,
    ),
    shouldPlayTiles: parseBoolean(stored.shouldPlayTiles, true),
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

export function setMessageClearAfterPlayback(
  shouldClearAfterPlayback: boolean,
): void {
  patchState(messagePreferencesStore, { shouldClearAfterPlayback });
}

export function setMessagePlayTiles(shouldPlayTiles: boolean): void {
  patchState(messagePreferencesStore, { shouldPlayTiles });
}

export function useMessagePreferences(): MessagePreferences {
  return useExternalStore(messagePreferencesStore);
}
