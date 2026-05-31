import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

export interface PlaybackSettings {
  highlightActivePart: boolean;
}

const DEFAULT_SETTINGS: PlaybackSettings = {
  highlightActivePart: false,
};

export function parsePlaybackSettings(raw: unknown): PlaybackSettings {
  const parsed = (raw ?? {}) as Partial<PlaybackSettings>;

  return {
    highlightActivePart:
      typeof parsed.highlightActivePart === "boolean"
        ? parsed.highlightActivePart
        : DEFAULT_SETTINGS.highlightActivePart,
  };
}

const settingsStore = createPersistedStore<PlaybackSettings>(
  "playback-settings",
  parsePlaybackSettings,
);

export function setHighlightActivePart(highlightActivePart: boolean): void {
  settingsStore.setState({
    ...settingsStore.getSnapshot(),
    highlightActivePart,
  });
}

export function usePlaybackSettings(): PlaybackSettings {
  return useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.getSnapshot,
  );
}
