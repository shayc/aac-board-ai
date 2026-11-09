import Stack from "@mui/material/Stack";
import { useEffect, useRef } from "react";
import { AACSymbol } from "../aac-symbol/aac-symbol";
import type { MessagePart } from "./message-types";
import { PlayButton } from "./play-button";

export interface MessageBarProps {
  parts: readonly MessagePart[];
  activePartId: string | null;
  areImagesVisible: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function MessageBar({
  parts,
  activePartId,
  areImagesVisible,
  isPlaying,
  onPlay,
  onStop,
}: MessageBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    return scheduleScrollIntoView(container.lastElementChild, "end");
  }, [parts]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || activePartId === null) {
      return;
    }

    const index = parts.findIndex((part) => part.id === activePartId);
    if (index === -1) {
      return;
    }

    return scheduleScrollIntoView(container.children.item(index), "nearest");
  }, [activePartId, parts]);

  return (
    <Stack direction="row" sx={{ p: { xs: 2, sm: 3 }, userSelect: "text" }}>
      <Stack
        direction="row"
        sx={[
          {
            flexGrow: 1,
            gap: 2,
            overflow: "hidden",
            border: 1,
            borderColor: "divider",
            borderRadius: (theme) => theme.vars.shape.borderRadiusFull,
            bgcolor: "background.paper",
          },
          (theme) =>
            theme.applyStyles("light", {
              borderColor: "transparent",
              boxShadow: theme.vars.shadows[1],
            }),
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
          {parts.map((part) => (
            <MessagePartItem
              key={part.id}
              label={part.label}
              imageSrc={part.imageSrc}
              isActive={part.id === activePartId}
              isImageHidden={!areImagesVisible}
            />
          ))}
        </Stack>

        <PlayButton
          disabled={!isPlaying && parts.length === 0}
          isPlaying={isPlaying}
          onPlay={onPlay}
          onStop={onStop}
        />
      </Stack>
    </Stack>
  );
}

interface MessagePartItemProps {
  label: string;
  imageSrc?: string;
  isActive: boolean;
  isImageHidden: boolean;
}

function MessagePartItem({
  label,
  imageSrc,
  isActive,
  isImageHidden,
}: MessagePartItemProps) {
  return (
    <Stack
      direction="row"
      sx={(theme) => ({
        p: 1,
        borderRadius: theme.vars.shape.borderRadius,
        outline: isActive
          ? `2px solid ${theme.vars.palette.primary.main}`
          : "none",
        outlineOffset: -2,
      })}
    >
      <AACSymbol
        label={label}
        imageSrc={imageSrc}
        isImageHidden={isImageHidden}
      />
    </Stack>
  );
}

function scheduleScrollIntoView(
  element: Element | null,
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
