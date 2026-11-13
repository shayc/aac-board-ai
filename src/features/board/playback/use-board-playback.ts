import { m } from "@paraglide/messages.js";
import type { PlaybackRequest } from "@shared/playback/playback-types";
import {
  useActiveCue,
  useIsPlaying,
  usePlayback,
} from "@shared/playback/use-playback";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import type { MessagePart } from "../message/message-types";
import { planPlayback } from "./plan-playback";

const MESSAGE_OWNER = "board-message";
const TILE_OWNER = "board-tile";

interface UseBoardPlaybackOptions {
  onMessagePlayback?: (completion: Promise<boolean>) => void;
}

export interface UseBoardPlaybackReturn {
  isMessagePlaying: boolean;
  /** Resolves to whether the message played to its end. */
  playMessage: (parts: readonly MessagePart[]) => Promise<boolean>;
  /** Plays the message without reporting it as spoken, for tiles that play each word as it is spelled. */
  echoMessage: (parts: readonly MessagePart[]) => Promise<boolean>;
  playPart: (part: MessagePart) => Promise<void>;
  stop: () => void;
}

export function useBoardPlayback({
  onMessagePlayback,
}: UseBoardPlaybackOptions = {}): UseBoardPlaybackReturn {
  const playback = usePlayback();
  const { showSnackbar } = useSnackbar();
  const isMessagePlaying = useIsPlaying(MESSAGE_OWNER);

  // AAC users depend on knowing their speech output failed, so a failure is
  // reported here, once, instead of being left to each caller.
  async function playAndReportFailure(
    request: PlaybackRequest,
  ): Promise<boolean> {
    const outcome = await playback.play(request);
    if (outcome === "failed") {
      showSnackbar({
        message: (t) => t(m.playbackFailed),
        severity: "error",
      });
    }

    return outcome === "completed";
  }

  function playMessage(parts: readonly MessagePart[]) {
    const completion = echoMessage(parts);
    onMessagePlayback?.(completion);

    return completion;
  }

  function echoMessage(parts: readonly MessagePart[]) {
    return playAndReportFailure({
      owner: MESSAGE_OWNER,
      steps: planPlayback(parts),
    });
  }

  async function playPart(part: MessagePart) {
    await playAndReportFailure({
      owner: TILE_OWNER,
      steps: planPlayback([part]),
    });
  }

  return {
    isMessagePlaying,
    playMessage,
    echoMessage,
    playPart,
    stop: playback.stop,
  };
}

export function useActiveMessagePartId(): string | null {
  return useActiveCue(MESSAGE_OWNER);
}
