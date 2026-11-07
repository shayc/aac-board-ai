import { createPersistedStore } from "@shared/state/persisted-store";
import { useSyncExternalStore } from "react";

interface PlaybackPreferences {
  isHighlightingEnabled: boolean;
}

export function parsePlaybackPreferences(raw: unknown): PlaybackPreferences {
  const stored = (raw ?? {}) as Record<string, unknown>;

  return {
    isHighlightingEnabled:
      typeof stored.isHighlightingEnabled === "boolean"
        ? stored.isHighlightingEnabled
        : true,
  };
}

const playbackPreferencesStore = createPersistedStore<PlaybackPreferences>(
  "playback-preferences",
  parsePlaybackPreferences,
);

export function setPlaybackHighlightingEnabled(
  isHighlightingEnabled: boolean,
): void {
  playbackPreferencesStore.setState({
    ...playbackPreferencesStore.getSnapshot(),
    isHighlightingEnabled,
  });
}

export function usePlaybackPreferences(): PlaybackPreferences {
  return useSyncExternalStore(
    playbackPreferencesStore.subscribe,
    playbackPreferencesStore.getSnapshot,
  );
}
