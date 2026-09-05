import { use, useSyncExternalStore } from "react";
import { PlaybackContext } from "./playback-context";
import type { PlaybackController } from "./playback-types";

export function usePlayback(): PlaybackController {
  const context = use(PlaybackContext);

  if (!context) {
    throw new Error("usePlayback must be used within PlaybackProvider");
  }

  return context;
}

export function useIsPlaybackActive(origin?: string): boolean {
  const playback = usePlayback();

  return useSyncExternalStore(playback.subscribe, () => {
    const state = playback.getSnapshot();

    return (
      state.status === "playing" &&
      (origin === undefined || state.origin === origin)
    );
  });
}

export function useActivePlaybackTrackingKey(origin?: string): string | null {
  const playback = usePlayback();

  return useSyncExternalStore(playback.subscribe, () => {
    const state = playback.getSnapshot();

    if (
      state.status !== "playing" ||
      (origin !== undefined && state.origin !== origin)
    ) {
      return null;
    }

    return state.activeTrackingKey;
  });
}
