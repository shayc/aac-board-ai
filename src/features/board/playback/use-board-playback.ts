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

export interface UseBoardPlaybackReturn {
  isMessagePlaying: boolean;
  // Both play functions resolve to whether playback completed; failures are
  // already reported to the user, so callers have no outcome to handle.
  playMessage: (parts: readonly MessagePart[]) => Promise<boolean>;
  playPart: (part: MessagePart) => Promise<boolean>;
  stop: () => void;
}

export function useBoardPlayback(): UseBoardPlaybackReturn {
  const playback = usePlayback();
  const { showSnackbar } = useSnackbar();
  const isMessagePlaying = useIsPlaying(MESSAGE_OWNER);

  // AAC users depend on knowing that nothing was heard, so a failure is reported
  // here, once, instead of being left to each caller.
  async function play(request: PlaybackRequest): Promise<boolean> {
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
    return play({ owner: MESSAGE_OWNER, steps: planPlayback(parts) });
  }

  function playPart(part: MessagePart) {
    return play({ owner: TILE_OWNER, steps: planPlayback([part]) });
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
