import type { PlaybackOutcome } from "@shared/playback/playback-context";
import {
  useActivePlaybackTrackingKey,
  useIsPlaybackActive,
  usePlayback,
} from "@shared/playback/use-playback";
import type { MessagePart } from "../message/message-types";
import { planPlayback } from "../message/playback/plan-playback";

const MESSAGE_SOURCE = "board-message";
const TILE_SOURCE = "board-tile";

export interface UseBoardPlaybackReturn {
  isPlaying: boolean;
  playMessage: (parts: MessagePart[]) => Promise<PlaybackOutcome>;
  playPart: (part: MessagePart) => Promise<PlaybackOutcome>;
  stop: () => void;
}

export function useBoardPlayback(): UseBoardPlaybackReturn {
  const playback = usePlayback();
  const isPlaying = useIsPlaybackActive(MESSAGE_SOURCE);

  function playMessage(parts: MessagePart[]) {
    return playback.play({
      source: MESSAGE_SOURCE,
      steps: planPlayback(parts),
    });
  }

  function playPart(part: MessagePart) {
    return playback.play({ source: TILE_SOURCE, steps: planPlayback([part]) });
  }

  return {
    isPlaying,
    playMessage,
    playPart,
    stop: playback.stop,
  };
}

export function useActiveMessagePartId(): string | null {
  return useActivePlaybackTrackingKey(MESSAGE_SOURCE);
}
