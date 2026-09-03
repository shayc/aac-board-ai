import { MessageBar } from "../message/message-bar";
import type { MessagePart } from "../message/message-types";
import { useBoardPlaybackConfig } from "./playback-config-store";
import {
  useActiveMessagePartId,
  type UseBoardPlaybackReturn,
} from "./use-board-playback";

interface BoardPlaybackMessageBarProps {
  parts: MessagePart[];
  playback: Pick<
    UseBoardPlaybackReturn,
    "isMessagePlaying" | "playMessage" | "stop"
  >;
}

export function BoardPlaybackMessageBar({
  parts,
  playback,
}: BoardPlaybackMessageBarProps) {
  const activePartId = useActiveMessagePartId();
  const { isMessagePartHighlightingEnabled } = useBoardPlaybackConfig();

  return (
    <MessageBar
      parts={parts}
      activePartId={isMessagePartHighlightingEnabled ? activePartId : null}
      isPlaying={playback.isMessagePlaying}
      onPlay={() => void playback.playMessage(parts)}
      onStop={playback.stop}
    />
  );
}
