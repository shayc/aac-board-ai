import { useExternalStore } from "@shared/state/external-store";
import { use } from "react";
import { PlaybackContext } from "./playback-context";
import type { PlaybackController, PlaybackState } from "./playback-types";

type PlayingState = Extract<PlaybackState, { status: "playing" }>;

export function usePlayback(): PlaybackController {
  const context = use(PlaybackContext);
  if (!context) {
    throw new Error("usePlayback must be used within PlaybackProvider");
  }

  return context;
}

export function useIsPlaying(owner?: string): boolean {
  const playback = usePlayback();

  return useExternalStore(playback, (state) => isPlayingFor(state, owner));
}

export function useActiveCue(owner?: string): string | null {
  const playback = usePlayback();

  return useExternalStore(playback, (state) =>
    isPlayingFor(state, owner) ? state.activeCue : null,
  );
}

function isPlayingFor(
  state: PlaybackState,
  owner: string | undefined,
): state is PlayingState {
  return (
    state.status === "playing" && (owner === undefined || state.owner === owner)
  );
}
