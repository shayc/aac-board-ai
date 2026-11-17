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
  /** Plays the message without marking it played (e.g. echoing a word as it is spelled). */
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
  const { language } = useCommunicationLanguage();
  const { showSnackbar } = useSnackbar();
  const isMessagePlaying = useIsPlaying(MESSAGE_OWNER);

  // Stop on unmount so a finishing utterance can't overwrite the next board's draft.
  useEffect(
    () => () => {
      if (isBoardPlayback(playback.getSnapshot())) {
        playback.stop();
      }
    },
    [playback],
  );

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
      steps: planPlayback(parts, language),
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
      steps: planPlayback([part], language),
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
