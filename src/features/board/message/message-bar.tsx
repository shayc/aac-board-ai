import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { type ReactNode, useEffectEvent, useLayoutEffect, useRef } from "react";
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
// Clears the bar's rounded end, which would clip the first word's ring.
const MESSAGE_PADDING = 3;

// The light scheme's teal fades into the bar's grey dark-mode ground; this
// one passes 3:1 on it and on the backspace disc.
const DARK_GROUND_PRIMARY = { main: "#00443d", mainChannel: "0 68 61" };

export interface MessageBarProps {
  parts: readonly MessagePart[];
  isWordOpen: boolean;
  activePartId: string | null;
  areImagesVisible: boolean;
  endAction?: ReactNode;
}

export function MessageBar({
  parts,
  isWordOpen,
  activePartId,
  areImagesVisible,
  endAction,
}: MessageBarProps) {
  const t = useTranslate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Avoid re-scrolling to activePartId when parts change mid-playback.
  const scrollActivePartIntoView = useEffectEvent((partId: string) => {
    const index = parts.findIndex((part) => part.id === partId);
    if (index === -1) {
      return;
    }

    scrollPartIntoView(
      scrollContainerRef.current?.children.item(index),
      "nearest",
    );
  });

  useLayoutEffect(() => {
    scrollPartIntoView(scrollContainerRef.current?.lastElementChild, "end");
  }, [parts]);

  // Runs after the parts effect so active-part scroll wins when an edit starts playback.
  useLayoutEffect(() => {
    if (activePartId !== null) {
      scrollActivePartIntoView(activePartId);
    }
  }, [activePartId]);

  const openPartId = isWordOpen ? parts.at(-1)?.id : undefined;

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
            language={part.language}
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

function scrollPartIntoView(
  element: Element | null | undefined,
  inline: ScrollLogicalPosition,
) {
  element?.scrollIntoView({ block: "nearest", inline, behavior: "instant" });
}

function messageBarSx(theme: Theme) {
  return {
    alignItems: "center",
    gap: 2,
    px: BAR_INSET,
    overflow: "hidden",
    color: "text.primary",
    // Outlines the bar in forced-colors mode, where shadows and fills are stripped.
    border: 1,
    borderColor: "transparent",
    borderRadius: theme.vars.shape.borderRadiusFull,
    bgcolor: "background.paper",
    colorScheme: "light",
    userSelect: "text",
    ...theme.applyStyles("light", { boxShadow: theme.vars.shadows[1] }),
    // Dim the light surface against the dark page while keeping symbols on a light ground.
    ...theme.applyStyles("dark", {
      // Rings and controls inside the bar read the primary color from these.
      "--mui-palette-primary-main": DARK_GROUND_PRIMARY.main,
      "--mui-palette-primary-mainChannel": DARK_GROUND_PRIMARY.mainChannel,
      bgcolor: `color-mix(in srgb, ${theme.vars.palette.grey[400]}, ${theme.vars.palette.grey[500]} 40%)`,
    }),
  } as const;
}

function scrollContainerSx(theme: Theme) {
  return {
    flexGrow: 1,
    alignSelf: "stretch",
    // A fixed height stops the first word added from pushing the board down.
    height: `calc(${MESSAGE_ACTION_SIZE}px + ${theme.spacing(BAR_INSET * 2)})`,
    px: MESSAGE_PADDING,
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
        borderRadius: theme.vars.shape.borderRadiusSm,
        outline: isActive
          ? `2px solid ${theme.vars.palette.primary.main}`
          : "none",
        // Clear of the bar's edges, which the word's box reaches.
        outlineOffset: -4,
        // Border caret marks an open word and survives forced-colors mode.
        ...(isOpen && {
          "&::after": {
            content: '""',
            alignSelf: "center",
            // As tall as the line of the word it follows.
            height: "1.2em",
            marginInlineStart: theme.spacing(0.5),
            fontSize: theme.typography.h5.fontSize,
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
