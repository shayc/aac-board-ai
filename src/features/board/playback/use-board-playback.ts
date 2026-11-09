import type { PlaybackOutcome } from "@shared/playback/playback-types";
import {
  useActiveCue,
  useIsPlaying,
  usePlayback,
} from "@shared/playback/use-playback";
import type { MessagePart } from "../message/message-types";
import { planPlayback } from "./plan-playback";

const MESSAGE_OWNER = "board-message";
const TILE_OWNER = "board-tile";

export interface UseBoardPlaybackReturn {
  isMessagePlaying: boolean;
  playMessage: (parts: readonly MessagePart[]) => Promise<PlaybackOutcome>;
  playPart: (part: MessagePart) => Promise<PlaybackOutcome>;
  stop: () => void;
}

export function useBoardPlayback(): UseBoardPlaybackReturn {
  const playback = usePlayback();
  const isMessagePlaying = useIsPlaying(MESSAGE_OWNER);

  function playMessage(parts: readonly MessagePart[]) {
    return playback.play({
      owner: MESSAGE_OWNER,
      steps: planPlayback(parts),
    });
  }

  function playPart(part: MessagePart) {
    return playback.play({ owner: TILE_OWNER, steps: planPlayback([part]) });
  }

  return {
    isMessagePlaying,
    playMessage,
    playPart,
    stop: playback.stop,
  };
}

export function useActiveMessagePartId(): string | null {
  return useActiveCue(MESSAGE_OWNER);
}
