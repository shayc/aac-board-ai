import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { useEffect, useRef } from "react";
import { AACSymbol } from "../aac-symbol/aac-symbol";
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
      sx={[
        {
          gap: 2,
          overflow: "hidden",
          border: 1,
          borderColor: "transparent",
          borderRadius: (theme) => theme.vars.shape.borderRadiusFull,
          color: "text.primary",
          bgcolor: "background.paper",
          colorScheme: "light",
          userSelect: "text",
        },
        (theme) =>
          theme.applyStyles("light", {
            boxShadow: theme.vars.shadows[1],
          }),
        (theme) =>
          theme.applyStyles("dark", {
            bgcolor: theme.vars.palette.grey[400],
          }),
      ]}
    >
      <Stack
        ref={scrollContainerRef}
        // No live region: each tile is already spoken aloud as it is added.
        role="list"
        aria-label={t(m.messageLabel)}
        // A long message scrolls and its parts take no focus, so the
        // scroller is the keyboard's way to read the rest of it. An empty
        // message has nothing to read and stays out of the tab order.
        tabIndex={parts.length > 0 ? 0 : undefined}
        direction="row"
        sx={(theme) => ({
          flexGrow: 1,
          alignItems: "center",
          py: 1,
          px: 2,
          overflow: "auto",
          // Rounded like the bar's leading end so the focus ring isn't
          // clipped by it.
          borderStartStartRadius: theme.vars.shape.borderRadiusFull,
          borderEndStartRadius: theme.vars.shape.borderRadiusFull,
          // The bar clips overflow, so the theme's ring is drawn inset.
          "&:focus-visible": { ...theme.focusVisible, outlineOffset: -4 },
        })}
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
