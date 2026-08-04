import { useHighlightConfig } from "@shared/playback-highlight/highlight-store";
import { MessageBar, type MessageBarProps } from "../message/message-bar";
import type { MessagePart } from "../message/message-types";
import { useActiveMessagePartId, useBoardPlayback } from "./use-board-playback";

interface BoardPlaybackMessageBarProps {
  parts: MessagePart[];
  slotProps?: MessageBarProps["slotProps"];
}

export function BoardPlaybackMessageBar({
  parts,
  slotProps,
}: BoardPlaybackMessageBarProps) {
  const playback = useBoardPlayback();
  const activePartId = useActiveMessagePartId();
  const { highlightActivePart } = useHighlightConfig();
  const playButtonProps = {
    ...slotProps?.playButton,
    disabled: parts.length === 0 || slotProps?.playButton?.disabled,
  };

  return (
    <MessageBar
      parts={parts}
      activePartId={highlightActivePart ? activePartId : null}
      isPlaying={playback.isPlaying}
      slotProps={{ playButton: playButtonProps }}
      onPlayClick={() => void playback.playMessage(parts)}
      onStopClick={playback.stop}
    />
  );
}
