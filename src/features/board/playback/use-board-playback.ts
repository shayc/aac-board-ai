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
import type { MessagePart } from "../message/message";
import type { PlayMessage } from "../message/use-message";
import { planPlayback } from "./plan-playback";

const MESSAGE_OWNER = "board-message";
const TILE_OWNER = "board-tile";
const BOARD_OWNERS: ReadonlySet<string> = new Set([MESSAGE_OWNER, TILE_OWNER]);

export interface UseBoardPlaybackReturn {
  isMessagePlaying: boolean;
  /**
   * Only plays: `useMessage`'s `play` runs it and decides whether the message
   * counts as played.
   */
  playMessage: PlayMessage;
  playPart: (part: MessagePart) => Promise<void>;
  stop: () => void;
}

export function useBoardPlayback(): UseBoardPlaybackReturn {
  const playback = usePlayback();
  const { language } = useCommunicationLanguage();
  const { showSnackbar } = useSnackbar();
  const isMessagePlaying = useIsPlaying(MESSAGE_OWNER);

  // Playback outlives the board, so a closing board stops its own; a message
  // it finished later would be saved as played over the next board's draft.
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

  function playMessage(parts: readonly MessagePart[]) {
    return playAndReportFailure({
      owner: MESSAGE_OWNER,
      steps: planPlayback(parts, language),
    });
  }

  async function playPart(part: MessagePart) {
    await playAndReportFailure({
      owner: TILE_OWNER,
      steps: planPlayback([part], language),
    });
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

function isBoardPlayback(state: PlaybackState): boolean {
  return state.status === "playing" && BOARD_OWNERS.has(state.owner);
}
