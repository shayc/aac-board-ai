import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { shortLandscape } from "@shared/theme/short-landscape";
import { LIGHT_SCHEME_CLASS } from "@shared/theme/theme";
import { type ReactNode, useEffectEvent, useLayoutEffect, useRef } from "react";
import {
  AACSymbol,
  SYMBOL_IMAGE_SIZE_PROPERTY,
} from "../aac-symbol/aac-symbol";
import { CONTROL_SIZE_PROPERTY, CONTROL_SIZES } from "../board-control-sizes";
import type { MessagePart } from "./message-types";

// A short landscape screen gets compact; smaller symbols leave room for labels.
const BAR_SIZES = {
  regular: { control: CONTROL_SIZES.large, symbol: 64 },
  compact: { control: CONTROL_SIZES.medium, symbol: 48 },
} as const;

const BAR_INSET = 1;
// Clears the bar's rounded end, which would clip the first word's ring.
const MESSAGE_PADDING = 3;

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

  // Reads the latest parts without reacting to them, so an edit during
  // playback shows the newest part instead of jumping back to the active one.
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

  // Declared after the newest-part scroll so it wins when an edit starts
  // playback in the same render, as a spelling tile's echo does.
  useLayoutEffect(() => {
    if (activePartId !== null) {
      scrollActivePartIntoView(activePartId);
    }
  }, [activePartId]);

  const openPartId = isWordOpen ? parts.at(-1)?.id : undefined;

  return (
    <Stack
      // Imported symbols need a light background in both themes.
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
    ...barSizeProperties(BAR_SIZES.regular),
    flexGrow: 1,
    alignItems: "center",
    gap: 2,
    px: BAR_INSET,
    overflow: "hidden",
    color: "text.primary",
    // Forced-colors mode paints this border in place of the shadow and fill.
    border: 1,
    borderColor: "transparent",
    borderRadius: theme.vars.shape.borderRadiusFull,
    bgcolor: "background.paper",
    colorScheme: "light",
    userSelect: "text",
    ...theme.applyStyles("light", { boxShadow: theme.vars.shadows[1] }),
    // In dark mode white would outshine the board and mid grey reads as
    // disabled; grey 300 is as light as the board's pastel tiles.
    ...theme.applyStyles("dark", { bgcolor: theme.vars.palette.grey[300] }),
    [shortLandscape(theme)]: barSizeProperties(BAR_SIZES.compact),
  } as const;
}

type BarSize = (typeof BAR_SIZES)[keyof typeof BAR_SIZES];

function barSizeProperties({ control, symbol }: BarSize) {
  return {
    [CONTROL_SIZE_PROPERTY]: `${control}px`,
    [SYMBOL_IMAGE_SIZE_PROPERTY]: `${symbol}px`,
  };
}

function scrollContainerSx(theme: Theme) {
  return {
    flexGrow: 1,
    alignSelf: "stretch",
    // A fixed height stops the first word added from pushing the board down.
    height: `calc(var(${CONTROL_SIZE_PROPERTY}) + ${theme.spacing(BAR_INSET * 2)})`,
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
        py: 0.5,
        px: 1,
        borderRadius: theme.vars.shape.borderRadiusSm,
        outline: isActive
          ? `2px solid ${theme.vars.palette.primary.main}`
          : "none",
        // Clear of the bar's edges, which the word's box reaches.
        outlineOffset: -4,
        // A caret marks the open word, so closing or reopening it shows. A
        // border, because forced-colors mode repaints backgrounds.
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
