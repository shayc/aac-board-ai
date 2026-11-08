import { createPersistedStore } from "@shared/state/persisted-store";
import { useSyncExternalStore } from "react";

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

function parseBoolean(value: unknown, defaultValue: boolean): boolean {
  return typeof value === "boolean" ? value : defaultValue;
}

const messagePreferencesStore = createPersistedStore<MessagePreferences>(
  "message-preferences",
  parseMessagePreferences,
);

function updatePreferences(patch: Partial<MessagePreferences>): void {
  messagePreferencesStore.setState({
    ...messagePreferencesStore.getSnapshot(),
    ...patch,
  });
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
  return useSyncExternalStore(
    messagePreferencesStore.subscribe,
    messagePreferencesStore.getSnapshot,
  );
}
