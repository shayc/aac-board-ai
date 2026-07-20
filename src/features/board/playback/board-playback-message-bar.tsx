import { useHighlightConfig } from "@shared/highlight/highlight-store";
import { useActivePlaybackTrackingKey } from "@shared/playback/use-playback";
import { MessageBar, type MessageBarProps } from "../message/message-bar";
import type { MessagePart } from "../message/message-types";

interface BoardPlaybackMessageBarProps {
  parts: MessagePart[];
  isPlaying: boolean;
  playDisabled: boolean;
  playButtonSlotProps: NonNullable<MessageBarProps["slotProps"]>["playButton"];
  onPlayClick: () => void;
  onStopClick: () => void;
}

export function BoardPlaybackMessageBar({
  parts,
  isPlaying,
  playDisabled,
  playButtonSlotProps,
  onPlayClick,
  onStopClick,
}: BoardPlaybackMessageBarProps) {
  const { highlightActivePart } = useHighlightConfig();
  const activePartId = useActivePlaybackTrackingKey();

  return (
    <MessageBar
      parts={parts}
      activePartId={highlightActivePart ? activePartId : null}
      isPlaying={isPlaying}
      playDisabled={playDisabled}
      slotProps={{ playButton: playButtonSlotProps }}
      onPlayClick={onPlayClick}
      onStopClick={onStopClick}
    />
  );
}
