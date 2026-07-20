import { useHighlightConfig } from "@shared/highlight/highlight-store";
import { useActivePlaybackTrackingKey } from "@shared/playback/use-playback";
import { MessageBar, type MessageBarProps } from "../message/message-bar";
import type { MessagePart } from "../message/message-types";
import { useBoardPlayback } from "./use-board-playback";

interface BoardPlaybackMessageBarProps {
  parts: MessagePart[];
  slotProps?: MessageBarProps["slotProps"];
}

export function BoardPlaybackMessageBar({
  parts,
  slotProps,
}: BoardPlaybackMessageBarProps) {
  const playback = useBoardPlayback();
  const { highlightActivePart } = useHighlightConfig();
  const activePartId = useActivePlaybackTrackingKey();

  return (
    <MessageBar
      parts={parts}
      activePartId={highlightActivePart ? activePartId : null}
      isPlaying={playback.isPlaying}
      slotProps={slotProps}
      onPlayClick={() => void playback.playMessage(parts)}
      onStopClick={playback.stop}
    />
  );
}
