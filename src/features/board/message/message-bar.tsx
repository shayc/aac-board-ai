import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import { typographyClasses } from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { shortLandscape } from "@shared/theme/short-landscape";
import { LIGHT_SCHEME_CLASS } from "@shared/theme/theme";
import { type ReactNode, useEffectEvent, useLayoutEffect, useRef } from "react";
import { AACSymbol, SYMBOL_IMAGE_SIZE_PROPERTY } from "../aac-symbol";
import { CONTROL_SIZE_PROPERTY, CONTROL_SIZES } from "../board-control-sizes";
import { usePlayingMessagePartId } from "../playback/use-board-playback";
import type { MessagePart } from "./message";
import { useMessagePreferences } from "./message-preferences-store";

// A short landscape screen gets compact; smaller symbols leave room for labels.
const BAR_SIZES = {
  regular: { control: CONTROL_SIZES.large, symbol: 64 },
  compact: { control: CONTROL_SIZES.medium, symbol: 48 },
} as const;

const BAR_INSET = 1;
// Clears the bar's rounded end, which would clip the first word.
const MESSAGE_PADDING = 3;
const PART_INLINE_PADDING = 1;
const HIGHLIGHTED_PART_ANCHOR = "--highlighted-message-part";

export interface MessageBarProps {
  parts: readonly MessagePart[];
  isWordOpen: boolean;
  endAction?: ReactNode;
}

export function MessageBar({ parts, isWordOpen, endAction }: MessageBarProps) {
  const t = useTranslate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const playingPartId = usePlayingMessagePartId();
  const { areImagesVisible, isHighlightingEnabled } = useMessagePreferences();
  const highlightedPartId = isHighlightingEnabled ? playingPartId : null;

  // Reads the latest parts without reacting to them, so an edit during
  // playback shows the newest part instead of jumping back to the highlighted one.
  const scrollHighlightedPartIntoView = useEffectEvent((partId: string) => {
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
  }, [parts, isWordOpen]);

  // Declared after the newest-part scroll so it wins when an edit starts
  // playback in the same render, as a spelling tile's echo does.
  useLayoutEffect(() => {
    if (highlightedPartId !== null) {
      scrollHighlightedPartIntoView(highlightedPartId);
    }
  }, [highlightedPartId]);

  const lastPart = parts.at(-1);
  const caretPartId = lastPart?.kind === "text" ? lastPart.id : undefined;
  const caretPosition = isWordOpen ? "word-end" : "next-word";

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
        sx={[
          scrollContainerSx,
          highlightedPartId !== null && highlightedPartFillSx,
        ]}
      >
        {parts.map((part) => (
          <MessagePartItem
            key={part.id}
            label={part.label}
            language={part.language}
            imageSrc={part.kind === "tile" ? part.imageSrc : undefined}
            isHighlighted={part.id === highlightedPartId}
            caretPosition={part.id === caretPartId ? caretPosition : undefined}
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
    position: "relative",
    // Keeps the highlighted part's fill behind the labels but above the bar.
    isolation: "isolate",
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

function highlightedPartFillSx(theme: Theme) {
  const blockOutset = theme.spacing(0.25);
  const inlineOutset = theme.spacing(PART_INLINE_PADDING);

  return {
    "&::after": {
      content: '""',
      position: "absolute",
      zIndex: -1,
      positionAnchor: HIGHLIGHTED_PART_ANCHOR,
      top: `calc(anchor(top) - ${blockOutset})`,
      bottom: `calc(anchor(bottom) - ${blockOutset})`,
      // Logical insets, since the RTL stylis plugin flips `left` and `right`
      // but not the `anchor()` sides inside them.
      insetInlineStart: `calc(anchor(start) - ${inlineOutset})`,
      insetInlineEnd: `calc(anchor(end) - ${inlineOutset})`,
      borderRadius: theme.vars.shape.borderRadiusFull,
      bgcolor: "primary.main",
      // Forced-colors mode drops the fill but paints a transparent outline.
      outline: "2px solid transparent",
      pointerEvents: "none",
    },
  };
}

interface MessagePartItemProps {
  label: string;
  language: string | undefined;
  imageSrc?: string;
  isHighlighted: boolean;
  caretPosition: "word-end" | "next-word" | undefined;
  isImageVisible: boolean;
}

function MessagePartItem({
  label,
  language,
  imageSrc,
  isHighlighted,
  caretPosition,
  isImageVisible,
}: MessagePartItemProps) {
  return (
    <Stack
      role="listitem"
      lang={language}
      direction="row"
      sx={(theme) => ({
        py: 0.5,
        px: PART_INLINE_PADDING,
        [`& .${typographyClasses.root}`]: {
          anchorName: isHighlighted ? HIGHLIGHTED_PART_ANCHOR : "none",
          color: isHighlighted
            ? theme.vars.palette.primary.contrastText
            : undefined,
        },
        // Forced-colors mode repaints backgrounds, so draw the caret as a border.
        ...(caretPosition && {
          "&::after": {
            content: '""',
            alignSelf: "center",
            height: "1.2em",
            marginInlineStart: theme.spacing(
              caretPosition === "next-word" ? PART_INLINE_PADDING * 2 : 0.5,
            ),
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
