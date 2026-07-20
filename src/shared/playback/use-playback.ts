import { use, useSyncExternalStore } from "react";
import { PlaybackContext, type PlaybackController } from "./playback-context";

export function usePlayback(): PlaybackController {
  const context = use(PlaybackContext);

  if (!context) {
    throw new Error("usePlayback must be used within PlaybackProvider");
  }

  return context;
}

export function useIsPlaybackActive(source?: string): boolean {
  const playback = usePlayback();

  return useSyncExternalStore(playback.subscribe, () => {
    const state = playback.getSnapshot();

    return (
      state.status === "playing" &&
      (source === undefined || state.source === source)
    );
  });
}

export function useActivePlaybackTrackingKey(source?: string): string | null {
  const playback = usePlayback();

  return useSyncExternalStore(playback.subscribe, () => {
    const state = playback.getSnapshot();

    if (
      state.status !== "playing" ||
      (source !== undefined && state.source !== source)
    ) {
      return null;
    }

    return state.activeTrackingKey;
  });
}
