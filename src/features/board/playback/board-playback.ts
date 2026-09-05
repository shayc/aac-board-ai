import type { PlaybackController } from "@shared/playback/playback-types";
import type { MessagePart } from "../message/message-types";
import { planPlayback } from "./plan-playback";

export const MESSAGE_ORIGIN = "board-message";
const TILE_ORIGIN = "board-tile";

export function createBoardPlayback(playback: PlaybackController) {
  return {
    playMessage: (parts: readonly MessagePart[]) =>
      playback.play({ origin: MESSAGE_ORIGIN, steps: planPlayback(parts) }),
    playPart: (part: MessagePart) =>
      playback.play({ origin: TILE_ORIGIN, steps: planPlayback([part]) }),
    stop: playback.stop,
  };
}

export type BoardPlayback = ReturnType<typeof createBoardPlayback>;
