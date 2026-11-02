import { createPersistedStore } from "@shared/state/persisted-store";
import { useSyncExternalStore } from "react";

interface PlaybackPreferences {
  isPartHighlightingEnabled: boolean;
}

export function parsePlaybackPreferences(raw: unknown): PlaybackPreferences {
  const parsed = (raw ?? {}) as Record<string, unknown>;

  return {
    isPartHighlightingEnabled:
      typeof parsed.isPartHighlightingEnabled === "boolean"
        ? parsed.isPartHighlightingEnabled
        : false,
  };
}

const playbackPreferencesStore = createPersistedStore<PlaybackPreferences>(
  "playback-preferences",
  parsePlaybackPreferences,
);

export function setPartHighlightingEnabled(
  isPartHighlightingEnabled: boolean,
): void {
  playbackPreferencesStore.setState({
    ...playbackPreferencesStore.getSnapshot(),
    isPartHighlightingEnabled,
  });
}

export function usePlaybackPreferences(): PlaybackPreferences {
  return useSyncExternalStore(
    playbackPreferencesStore.subscribe,
    playbackPreferencesStore.getSnapshot,
  );
}
