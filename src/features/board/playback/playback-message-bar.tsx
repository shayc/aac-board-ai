import { MessageBar } from "../message/message-bar";
import { useMessagePreferences } from "../message/message-preferences-store";
import type { MessagePart } from "../message/message-types";
import {
  useActiveMessagePartId,
  type UseBoardPlaybackReturn,
} from "./use-board-playback";

interface PlaybackMessageBarProps {
  parts: readonly MessagePart[];
  isWordOpen: boolean;
  playback: Pick<
    UseBoardPlaybackReturn,
    "isMessagePlaying" | "playMessage" | "stop"
  >;
}

export function PlaybackMessageBar({
  parts,
  isWordOpen,
  playback,
}: PlaybackMessageBarProps) {
  const activePartId = useActiveMessagePartId();
  const { areImagesVisible, isHighlightingEnabled } = useMessagePreferences();

  return (
    <MessageBar
      parts={parts}
      isWordOpen={isWordOpen}
      activePartId={isHighlightingEnabled ? activePartId : null}
      areImagesVisible={areImagesVisible}
      isPlaying={playback.isMessagePlaying}
      onPlay={() => void playback.playMessage(parts)}
      onStop={playback.stop}
    />
  );
}
