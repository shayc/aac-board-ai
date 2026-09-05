import type { PlaybackOutcome } from "@shared/playback/playback-types";
import {
  useActivePlaybackTrackingKey,
  useIsPlaybackActive,
  usePlayback,
} from "@shared/playback/use-playback";
import type { MessagePart } from "../message/message-types";
import { createBoardPlayback, MESSAGE_ORIGIN } from "./board-playback";

export interface UseBoardPlaybackReturn {
  isMessagePlaying: boolean;
  playMessage: (parts: MessagePart[]) => Promise<PlaybackOutcome>;
  playPart: (part: MessagePart) => Promise<PlaybackOutcome>;
  stop: () => void;
}

export function useBoardPlayback(): UseBoardPlaybackReturn {
  const playback = usePlayback();
  const isMessagePlaying = useIsPlaybackActive(MESSAGE_ORIGIN);

  return {
    ...createBoardPlayback(playback),
    isMessagePlaying,
  };
}

export function useActiveMessagePartId(): string | null {
  return useActivePlaybackTrackingKey(MESSAGE_ORIGIN);
}
