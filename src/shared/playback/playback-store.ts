import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

export interface PlaybackConfig {
  highlightActivePart: boolean;
}

const DEFAULT_CONFIG: PlaybackConfig = {
  highlightActivePart: false,
};

export function parsePlaybackConfig(raw: unknown): PlaybackConfig {
  const parsed = (raw ?? {}) as Partial<PlaybackConfig>;

  return {
    highlightActivePart:
      typeof parsed.highlightActivePart === "boolean"
        ? parsed.highlightActivePart
        : DEFAULT_CONFIG.highlightActivePart,
  };
}

const playbackStore = createPersistedStore<PlaybackConfig>(
  "playback-config",
  parsePlaybackConfig,
);

export function setHighlightActivePart(highlightActivePart: boolean): void {
  playbackStore.setState({
    ...playbackStore.getSnapshot(),
    highlightActivePart,
  });
}

export function usePlaybackConfig(): PlaybackConfig {
  return useSyncExternalStore(
    playbackStore.subscribe,
    playbackStore.getSnapshot,
  );
}
