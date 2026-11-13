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
  language: string;
  isWordOpen: boolean;
  activePartId: string | null;
  areImagesVisible: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export function MessageBar({
  parts,
  language,
  isWordOpen,
  activePartId,
  areImagesVisible,
  isPlaying,
  onPlay,
  onStop,
}: MessageBarProps) {
  const t = useTranslate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const openPartId = isWordOpen ? parts.at(-1)?.id : undefined;

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
            language={language}
            imageSrc={part.kind === "tile" ? part.imageSrc : undefined}
            isActive={part.id === activePartId}
            isOpen={part.id === openPartId}
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
  language: string;
  imageSrc?: string;
  isActive: boolean;
  isOpen: boolean;
  isImageVisible: boolean;
}

function MessagePartItem({
  label,
  language,
  imageSrc,
  isActive,
  isOpen,
  isImageVisible,
}: MessagePartItemProps) {
  return (
    <Stack
      role="listitem"
      lang={language}
      direction="row"
      sx={(theme) => ({
        py: 0.5,
        px: 1,
        borderRadius: theme.vars.shape.borderRadius,
        outline: isActive
          ? `2px solid ${theme.vars.palette.primary.main}`
          : "none",
        outlineOffset: -2,
        // A caret marks the word that spelling still extends, so a space or
        // a backspace that only closes or reopens it has a visible result. It
        // is a border because forced-colors mode repaints backgrounds.
        ...(isOpen && {
          "&::after": {
            content: '""',
            marginInlineStart: "2px",
            borderInlineStart: "2px solid currentColor",
          },
        }),
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
