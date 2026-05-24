import Stack from "@mui/material/Stack";
import { useEffect, useRef } from "react";
import { Pictogram } from "../pictogram/pictogram";
import { BackspaceButton } from "./backspace-button";
import { PlayButton } from "./play-button";
import type { MessagePart } from "./use-message";

export interface MessageBarProps {
  parts: MessagePart[];
  isPlaying: boolean;
  onBackspacePress: () => void;
  onBackspaceLongPress: () => void;
  onPlayClick: () => void;
  onStopClick: () => void;
}

function scrollToEnd(container: HTMLElement | null): () => void {
  const lastChild = container?.lastElementChild;

  if (!lastChild) {
    return () => undefined;
  }

  const frameId = requestAnimationFrame(() => {
    lastChild.scrollIntoView({
      block: "nearest",
      inline: "end",
      behavior: "instant",
    });
  });

  return () => cancelAnimationFrame(frameId);
}

export function MessageBar({
  parts,
  isPlaying,
  onBackspacePress,
  onBackspaceLongPress,
  onPlayClick,
  onStopClick,
}: MessageBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return scrollToEnd(scrollContainerRef.current);
  }, [parts]);

  return (
    <Stack direction="row" sx={{ p: 2 }}>
      <Stack
        direction="row"
        sx={[
          {
            height: 104,
            flexGrow: 2,
            gap: 2,
            paddingInlineEnd: 2,
            borderRadius: 4, // 16px (4 * theme.shape.borderRadius)
            overflow: "hidden",
            bgcolor: "grey.200",
          },
          (theme) => theme.applyStyles("dark", { bgcolor: "grey.800" }),
        ]}
      >
        <Stack
          ref={scrollContainerRef}
          direction="row"
          sx={{ flexGrow: 1, padding: 2, gap: 1, overflow: "auto" }}
        >
          {parts.map((part, index) => (
            <Stack key={index} direction="row">
              <Pictogram label={part.label} src={part.imageSrc} />
            </Stack>
          ))}
        </Stack>

        <BackspaceButton
          onPress={onBackspacePress}
          onLongPress={onBackspaceLongPress}
        />
        <PlayButton
          isPlaying={isPlaying}
          onPlayClick={onPlayClick}
          onStopClick={onStopClick}
        />
      </Stack>
    </Stack>
  );
}
