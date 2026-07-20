import { use, useSyncExternalStore } from "react";
import { PlaybackContext, type PlaybackController } from "./playback-context";

export function usePlayback(): PlaybackController {
  const context = use(PlaybackContext);

  if (!context) {
    throw new Error("usePlayback must be used within PlaybackProvider");
  }

  return context;
}

export function useIsPlaybackActive(): boolean {
  const playback = usePlayback();

  return useSyncExternalStore(
    playback.subscribe,
    () => playback.getSnapshot().status === "playing",
  );
}

export function useActivePlaybackTrackingKey(): string | null {
  const playback = usePlayback();

  return useSyncExternalStore(playback.subscribe, () => {
    const state = playback.getSnapshot();

    return state.status === "playing" ? state.activeTrackingKey : null;
  });
}
