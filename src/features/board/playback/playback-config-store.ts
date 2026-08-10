import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

interface BoardPlaybackConfig {
  isMessagePartHighlightingEnabled: boolean;
}

export function parseBoardPlaybackConfig(raw: unknown): BoardPlaybackConfig {
  const parsed = (raw ?? {}) as Record<string, unknown>;

  return {
    isMessagePartHighlightingEnabled:
      typeof parsed.isMessagePartHighlightingEnabled === "boolean"
        ? parsed.isMessagePartHighlightingEnabled
        : false,
  };
}

const playbackConfigStore = createPersistedStore<BoardPlaybackConfig>(
  "board-playback",
  parseBoardPlaybackConfig,
);

export function setMessagePartHighlightingEnabled(
  isMessagePartHighlightingEnabled: boolean,
): void {
  playbackConfigStore.setState({
    ...playbackConfigStore.getSnapshot(),
    isMessagePartHighlightingEnabled,
  });
}

export function useBoardPlaybackConfig(): BoardPlaybackConfig {
  return useSyncExternalStore(
    playbackConfigStore.subscribe,
    playbackConfigStore.getSnapshot,
  );
}
