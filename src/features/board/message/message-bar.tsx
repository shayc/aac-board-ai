import Stack from "@mui/material/Stack";
import { useEffect, useRef } from "react";
import { Pictogram } from "../pictogram/pictogram";
import { PlayButton, type PlayButtonRootProps } from "./play-button";
import type { MessagePart } from "./message-types";

interface MessageBarSlotProps {
  playButton?: PlayButtonRootProps;
}

export interface MessageBarProps {
  parts: MessagePart[];
  activePartId: string | null;
  isPlaying: boolean;
  slotProps?: MessageBarSlotProps;
  onPlayClick: () => void;
  onStopClick: () => void;
}

export function MessageBar({
  parts,
  activePartId,
  isPlaying,
  slotProps,
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
    if (index === -1) {
      return;
    }

    return scrollElementIntoView(
      scrollContainerRef.current?.children[index],
      "nearest",
    );
  }, [activePartId, parts]);

  return (
    <Stack direction="row" sx={{ p: { xs: 2, sm: 3 }, userSelect: "text" }}>
      <Stack
        direction="row"
        sx={[
          {
            flexGrow: 1,
            gap: 2,
            borderRadius: 32,
            overflow: "hidden",
            bgcolor: "grey.200",
          },
          (theme) => theme.applyStyles("dark", { bgcolor: "grey.800" }),
        ]}
      >
        <Stack
          ref={scrollContainerRef}
          direction="row"
          sx={{
            flexGrow: 1,
            alignItems: "center",
            py: 1,
            px: 2,
            overflow: "auto",
          }}
        >
          {parts.map((part) => {
            const isActive = part.id === activePartId;

            return (
              <Stack
                key={part.id}
                direction="row"
                sx={(theme) => ({
                  p: 1,
                  borderRadius: 4,
                  outlineOffset: -2,
                  outline: isActive
                    ? `2px solid ${theme.vars?.palette.primary.main ?? theme.palette.primary.main}`
                    : "none",
                })}
              >
                <Pictogram label={part.label ?? ""} src={part.imageSrc} />
              </Stack>
            );
          })}
        </Stack>

        <PlayButton
          {...slotProps?.playButton}
          isPlaying={isPlaying}
          onPlayClick={onPlayClick}
          onStopClick={onStopClick}
        />
      </Stack>
    </Stack>
  );
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
