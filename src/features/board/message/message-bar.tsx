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
    return scheduleScrollIntoView(
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

    return scheduleScrollIntoView(
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
            overflow: "hidden",
            borderRadius: 32,
            bgcolor: "common.white",
          },
          (theme) => ({
            // An "input well": hairline edge plus a soft inner shadow.
            boxShadow: `inset 0 0 0 1px ${(theme.vars ?? theme).palette.divider}, inset 0 2px 4px rgb(0 0 0 / 0.06)`,
            ...theme.applyStyles("dark", {
              bgcolor: "#171a20",
              boxShadow:
                "inset 0 0 0 1px rgb(255 255 255 / 0.09), inset 0 2px 8px rgb(0 0 0 / 0.5)",
            }),
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
                    ? `2px solid ${(theme.vars ?? theme).palette.primary.main}`
                    : "none",
                  outlineOffset: -2,
                })}
              >
                <AACSymbol label={part.label} imageSrc={part.imageSrc} />
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

function scheduleScrollIntoView(
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
