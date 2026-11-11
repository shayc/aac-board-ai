import Stack from "@mui/material/Stack";
import { useEffect, useRef } from "react";
import { AACSymbol } from "../aac-symbol/aac-symbol";
import { brightnessTransition, dim } from "../board-brightness";
import { scanGroupProps } from "../scanning/scan-targets";
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

// Symbols are drawn for light backgrounds, so the bar stays a light surface in
// dark mode; the scheme class makes everything inside it resolve light tokens.
const LIGHT_SCHEME_CLASS = "light";

function dimmedSurface(color: string) {
  const background = dim(color);

  return {
    color: `contrast-color(${background})`,
    backgroundColor: background,
  };
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
    <Stack
      {...scanGroupProps}
      direction="row"
      sx={{ p: { xs: 2, sm: 3 }, userSelect: "text" }}
    >
      <Stack
        className={LIGHT_SCHEME_CLASS}
        direction="row"
        sx={[
          (theme) => ({
            flexGrow: 1,
            gap: 2,
            overflow: "hidden",
            border: 1,
            borderColor: "transparent",
            borderRadius: theme.vars.shape.borderRadiusFull,
            ...dimmedSurface(theme.vars.palette.background.paper),
            colorScheme: "light",
            transition: brightnessTransition(theme, [
              "background-color",
              "color",
            ]),
          }),
          (theme) =>
            theme.applyStyles("light", {
              boxShadow: theme.vars.shadows[1],
            }),
          (theme) =>
            theme.applyStyles(
              "dark",
              dimmedSurface(theme.vars.palette.grey[400]),
            ),
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
        // The label's color follows the bar's brightness, so the outline stays
        // visible on a dimmed bar where a fixed color would fade into it.
        outline: isActive ? "2px solid currentColor" : "none",
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
