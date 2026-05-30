import Stack from "@mui/material/Stack";
import { useEffect, useRef } from "react";
import { Pictogram } from "../pictogram/pictogram";
import { BackspaceButton } from "./backspace-button";
import { PlayButton } from "./play-button";
import type { MessagePart } from "./use-message";

export interface MessageBarProps {
  parts: MessagePart[];
  activePartId: string | null;
  isPlaying: boolean;
  onBackspacePress: () => void;
  onBackspaceLongPress: () => void;
  onPlayClick: () => void;
  onStopClick: () => void;
}

function scrollElementIntoView(
  element: Element | undefined,
  inline: ScrollLogicalPosition,
): () => void {
  if (!element) {
    return () => undefined;
  }

  const frameId = requestAnimationFrame(() => {
    element.scrollIntoView({ block: "nearest", inline, behavior: "instant" });
  });

  return () => cancelAnimationFrame(frameId);
}

export function MessageBar({
  parts,
  activePartId,
  isPlaying,
  onBackspacePress,
  onBackspaceLongPress,
  onPlayClick,
  onStopClick,
}: MessageBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return scrollElementIntoView(
      scrollContainerRef.current?.lastElementChild ?? undefined,
      "end",
    );
  }, [parts]);

  useEffect(() => {
    if (activePartId === null) {
      return;
    }

    const index = parts.findIndex((part) => part.id === activePartId);

    return scrollElementIntoView(
      scrollContainerRef.current?.children[index],
      "nearest",
    );
  }, [activePartId, parts]);

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
            borderRadius: 16,
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
            <Stack
              key={index}
              direction="row"
              sx={{
                px: 1,
                borderRadius: 8,
                bgcolor:
                  part.id === activePartId ? "action.selected" : "transparent",
              }}
            >
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
