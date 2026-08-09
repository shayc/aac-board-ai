import { useHighlightConfig } from "@shared/playback-highlight/highlight-store";
import { MessageBar } from "../message/message-bar";
import type { MessagePart } from "../message/message-types";
import { useActiveMessagePartId, useBoardPlayback } from "./use-board-playback";

interface BoardPlaybackMessageBarProps {
  parts: MessagePart[];
}

export function BoardPlaybackMessageBar({
  parts,
}: BoardPlaybackMessageBarProps) {
  const playback = useBoardPlayback();
  const activePartId = useActiveMessagePartId();
  const { highlightActivePart } = useHighlightConfig();

  return (
    <MessageBar
      parts={parts}
      activePartId={highlightActivePart ? activePartId : null}
      isPlaying={playback.isMessagePlaying}
      onPlayClick={() => void playback.playMessage(parts)}
      onStopClick={playback.stop}
    />
  );
}
