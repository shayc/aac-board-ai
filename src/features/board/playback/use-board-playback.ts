import { m } from "@paraglide/messages.js";
import { useCommunicationLanguage } from "@shared/language/language-store";
import type {
  PlaybackRequest,
  PlaybackState,
} from "@shared/playback/playback-types";
import {
  useActiveCue,
  useIsPlaying,
  usePlayback,
} from "@shared/playback/use-playback";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useEffect } from "react";
import type { MessagePart } from "../message/message-types";
import { planPlayback } from "./plan-playback";

const MESSAGE_OWNER = "board-message";
const TILE_OWNER = "board-tile";
const BOARD_OWNERS: ReadonlySet<string> = new Set([MESSAGE_OWNER, TILE_OWNER]);

interface UseBoardPlaybackOptions {
  onMessagePlayback?: (completion: Promise<boolean>) => void;
}

export interface UseBoardPlaybackReturn {
  isMessagePlaying: boolean;
  /** Plays the message without reporting it as played, for tiles that play each word as it is spelled. */
  echoMessage: (parts: readonly MessagePart[]) => Promise<boolean>;
  /** Resolves to whether the message played to its end. */
  playMessage: (parts: readonly MessagePart[]) => Promise<boolean>;
  playPart: (part: MessagePart) => Promise<void>;
  stop: () => void;
}

export function useBoardPlayback({
  onMessagePlayback,
}: UseBoardPlaybackOptions = {}): UseBoardPlaybackReturn {
  const playback = usePlayback();
  const { language: communicationLanguage } = useCommunicationLanguage();
  const { showSnackbar } = useSnackbar();
  const isMessagePlaying = useIsPlaying(MESSAGE_OWNER);

  // Playback outlives the board, so a board that closes stops its own: a
  // message it finished later would otherwise be saved as played over the
  // draft the next board is editing.
  useEffect(
    () => () => {
      if (isBoardPlayback(playback.getSnapshot())) {
        playback.stop();
      }
    },
    [playback],
  );

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

  function echoMessage(parts: readonly MessagePart[]) {
    return playAndReportFailure({
      owner: MESSAGE_OWNER,
      steps: planPlayback(parts, communicationLanguage),
    });
  }

  function playMessage(parts: readonly MessagePart[]) {
    const completion = echoMessage(parts);
    onMessagePlayback?.(completion);

    return completion;
  }

  async function playPart(part: MessagePart) {
    await playAndReportFailure({
      owner: TILE_OWNER,
      steps: planPlayback([part], communicationLanguage),
    });
  }

  return {
    isMessagePlaying,
    echoMessage,
    playMessage,
    playPart,
    stop: playback.stop,
  };
}

export function useActiveMessagePartId(): string | null {
  return useActiveCue(MESSAGE_OWNER);
}

function isBoardPlayback(state: PlaybackState): boolean {
  return state.status === "playing" && BOARD_OWNERS.has(state.owner);
}
