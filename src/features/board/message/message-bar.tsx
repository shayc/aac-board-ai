import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useEffect, useRef } from "react";
import { AACSymbol } from "../aac-symbol/aac-symbol";
import { scanGroupProps } from "../scanning/scan-targets";
import type { MessagePart } from "./message-types";
import { PlayButton } from "./play-button";

// Imported symbols need a light background in both themes.
const LIGHT_SCHEME_CLASS = "light";

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
  const t = useTranslate();
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
      className={LIGHT_SCHEME_CLASS}
      direction="row"
      sx={messageBarSx}
    >
      <Stack
        ref={scrollContainerRef}
        // A live region would repeat the tile's spoken feedback.
        role="list"
        aria-label={t(m.messageLabel)}
        // Keyboard users need focus here to scroll the message.
        tabIndex={parts.length > 0 ? 0 : undefined}
        direction="row"
        sx={scrollContainerSx}
      >
        {parts.map((part) => (
          <MessagePartItem
            key={part.id}
            label={part.label}
            imageSrc={part.imageSrc}
            isActive={part.id === activePartId}
            isImageVisible={areImagesVisible}
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
  );
}

function messageBarSx(theme: Theme) {
  return {
    gap: 2,
    overflow: "hidden",
    border: 1,
    borderColor: "transparent",
    borderRadius: theme.vars.shape.borderRadiusFull,
    color: "text.primary",
    bgcolor: "background.paper",
    colorScheme: "light",
    userSelect: "text",
    ...theme.applyStyles("light", { boxShadow: theme.vars.shadows[1] }),
    ...theme.applyStyles("dark", { bgcolor: theme.vars.palette.grey[400] }),
  } as const;
}

function scrollContainerSx(theme: Theme) {
  return {
    flexGrow: 1,
    alignItems: "center",
    py: 1,
    px: 2,
    overflow: "auto",
    borderStartStartRadius: theme.vars.shape.borderRadiusFull,
    borderEndStartRadius: theme.vars.shape.borderRadiusFull,
    // Keep the focus ring inside the bar's clipped overflow.
    "&:focus-visible": { ...theme.focusVisible, outlineOffset: -4 },
  };
}

interface MessagePartItemProps {
  label: string;
  imageSrc?: string;
  isActive: boolean;
  isImageVisible: boolean;
}

function MessagePartItem({
  label,
  imageSrc,
  isActive,
  isImageVisible,
}: MessagePartItemProps) {
  return (
    <Stack
      role="listitem"
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
        isImageVisible={isImageVisible}
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
