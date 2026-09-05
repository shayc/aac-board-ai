import { MessageBar } from "../message/message-bar";
import type { MessagePart } from "../message/message-types";
import { useBoardPlaybackConfig } from "./playback-config-store";
import { useIsPlaybackActive } from "@shared/playback/use-playback";
import { useActiveMessagePartId } from "./use-board-playback";
import { MESSAGE_ORIGIN } from "./board-playback";

interface BoardPlaybackMessageBarProps {
  parts: readonly MessagePart[];
  onPlay: () => void;
  onStop: () => void;
}

export function BoardPlaybackMessageBar({
  parts,
  onPlay,
  onStop,
}: BoardPlaybackMessageBarProps) {
  const activePartId = useActiveMessagePartId();
  const isPlaying = useIsPlaybackActive(MESSAGE_ORIGIN);
  const { isMessagePartHighlightingEnabled } = useBoardPlaybackConfig();

  return (
    <MessageBar
      parts={parts}
      activePartId={isMessagePartHighlightingEnabled ? activePartId : null}
      isPlaying={isPlaying}
      onPlay={onPlay}
      onStop={onStop}
    />
  );
}
