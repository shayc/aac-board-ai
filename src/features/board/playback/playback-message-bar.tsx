import type { ReactNode } from "react";
import { MessageBar } from "../message/message-bar";
import { useMessagePreferences } from "../message/message-preferences-store";
import type { MessagePart } from "../message/message-types";
import { useActiveMessagePartId } from "./use-board-playback";

interface PlaybackMessageBarProps {
  parts: readonly MessagePart[];
  language: string | undefined;
  isWordOpen: boolean;
  endAction?: ReactNode;
}

export function PlaybackMessageBar({
  parts,
  language,
  isWordOpen,
  endAction,
}: PlaybackMessageBarProps) {
  const activePartId = useActiveMessagePartId();
  const { areImagesVisible, isHighlightingEnabled } = useMessagePreferences();

  return (
    <MessageBar
      parts={parts}
      language={language}
      isWordOpen={isWordOpen}
      activePartId={isHighlightingEnabled ? activePartId : null}
      areImagesVisible={areImagesVisible}
      endAction={endAction}
    />
  );
}
