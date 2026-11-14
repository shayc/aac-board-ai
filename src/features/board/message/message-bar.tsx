import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { type ReactNode, useEffect, useRef } from "react";
import {
  AACSymbol,
  SYMBOL_IMAGE_SIZE_PROPERTY,
} from "../aac-symbol/aac-symbol";
import type { MessagePart } from "./message-types";

// Imported symbols need a light background in both themes.
const LIGHT_SCHEME_CLASS = "light";

export const MESSAGE_ACTION_SIZE = 80;
export const MESSAGE_ACTION_ICON_SIZE = 36;

const BAR_INSET = 1;

export interface MessageBarProps {
  parts: readonly MessagePart[];
  language: string | undefined;
  isWordOpen: boolean;
  activePartId: string | null;
  areImagesVisible: boolean;
  endAction?: ReactNode;
}

export function MessageBar({
  parts,
  language,
  isWordOpen,
  activePartId,
  areImagesVisible,
  endAction,
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
    <Stack className={LIGHT_SCHEME_CLASS} direction="row" sx={messageBarSx}>
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

      {endAction}
    </Stack>
  );
}

function messageBarSx(theme: Theme) {
  return {
    alignItems: "center",
    gap: 2,
    px: BAR_INSET,
    overflow: "hidden",
    border: 1,
    borderColor: "transparent",
    borderRadius: theme.vars.shape.borderRadiusFull,
    color: "text.primary",
    bgcolor: "background.paper",
    colorScheme: "light",
    userSelect: "text",
    ...theme.applyStyles("light", { boxShadow: theme.vars.shadows[1] }),
    // A full grey 400 glares against the dark page; symbols still need a light
    // ground.
    ...theme.applyStyles("dark", {
      bgcolor: `color-mix(in srgb, ${theme.vars.palette.grey[400]}, ${theme.vars.palette.grey[500]} 40%)`,
    }),
  } as const;
}

function scrollContainerSx(theme: Theme) {
  return {
    flexGrow: 1,
    alignSelf: "stretch",
    alignItems: "center",
    // A fixed height stops the first word added from pushing the board down.
    minHeight: `calc(${MESSAGE_ACTION_SIZE}px + ${theme.spacing(BAR_INSET * 2)})`,
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
  language: string | undefined;
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
        [SYMBOL_IMAGE_SIZE_PROPERTY]: "64px",
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
