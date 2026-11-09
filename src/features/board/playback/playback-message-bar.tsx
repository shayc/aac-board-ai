import { MessageBar } from "../message/message-bar";
import { useMessagePreferences } from "../message/message-preferences-store";
import type { MessagePart } from "../message/message-types";
import {
  useActiveMessagePartId,
  type UseBoardPlaybackReturn,
} from "./use-board-playback";

interface PlaybackMessageBarProps {
  parts: readonly MessagePart[];
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
  const { areImagesVisible, isHighlightingEnabled } = useMessagePreferences();

  return (
    <MessageBar
      parts={parts}
      activePartId={isHighlightingEnabled ? activePartId : null}
      areImagesVisible={areImagesVisible}
      isPlaying={playback.isMessagePlaying}
      onPlay={() => void playback.playMessage(parts)}
      onStop={playback.stop}
    />
  );
}
