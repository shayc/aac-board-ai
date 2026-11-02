import { MessageBar } from "../message/message-bar";
import type { MessagePart } from "../message/message-types";
import { usePlaybackPreferences } from "./playback-preferences-store";
import {
  useActiveMessagePartId,
  type UseBoardPlaybackReturn,
} from "./use-board-playback";

interface PlaybackMessageBarProps {
  parts: MessagePart[];
  playback: Pick<
    UseBoardPlaybackReturn,
    "isMessagePlaying" | "playMessage" | "stop"
  >;
}

export function PlaybackMessageBar({
  parts,
  playback,
}: PlaybackMessageBarProps) {
  const activePartId = useActiveMessagePartId();
  const { isPartHighlightingEnabled } = usePlaybackPreferences();

  return (
    <MessageBar
      parts={parts}
      activePartId={isPartHighlightingEnabled ? activePartId : null}
      isPlaying={playback.isMessagePlaying}
      onPlay={() => void playback.playMessage(parts)}
      onStop={playback.stop}
    />
  );
}
