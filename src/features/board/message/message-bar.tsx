import Stack from "@mui/material/Stack";
import { useEffect, useRef } from "react";
import { AACSymbol } from "../aac-symbol/aac-symbol";
import type { MessagePart } from "./message-types";
import { PlayButton } from "./play-button";

export interface MessageBarProps {
  parts: MessagePart[];
  activePartId: string | null;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function MessageBar({
  parts,
  activePartId,
  isPlaying,
  onPlay,
  onStop,
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
                  outline: isActive
                    ? `2px solid ${theme.vars?.palette.primary.main ?? theme.palette.primary.main}`
                    : "none",
                  outlineOffset: -2,
                })}
              >
                <AACSymbol label={part.label ?? ""} imageSrc={part.imageSrc} />
              </Stack>
            );
          })}
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
