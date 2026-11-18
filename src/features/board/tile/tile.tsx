import type { BoardButton } from "@features/library";
import Button, { buttonClasses } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { buttonFeedbackTransition } from "@shared/theme/button-feedback";
import type { CSSProperties } from "react";
import {
  AACSymbol,
  SYMBOL_LABEL_FONT_SIZE_PROPERTY,
} from "../aac-symbol/aac-symbol";
import { useTilePreferences } from "./tile-preferences-store";

interface TileProps {
  button: BoardButton;
  language: string | undefined;
  tabIndex: number;
  onActivate: (button: BoardButton) => void;
}

export function Tile({ button, language, tabIndex, onActivate }: TileProps) {
  const t = useTranslate();
  const { saturation, brightness, areBordersVisible, labelPlacement } =
    useTilePreferences();

  const ariaLabel = button.label ? undefined : button.vocalization;
  const isFolder = Boolean(button.linkedBoardId);
  const colorStyle = tileColorStyle({
    backgroundColor: button.backgroundColor,
    borderColor: button.borderColor,
    isBorderVisible: areBordersVisible,
    saturation,
    brightness,
  });

  const symbolLabelPlacement = labelPlacement === "top" ? "top" : "bottom";
  const isLabelVisible = labelPlacement !== "hidden";

  return (
    <Button
      aria-label={ariaLabel}
      aria-description={isFolder ? t(m.tileOpensBoard) : undefined}
      // The description is UI text, but the name is what must be pronounced right.
      lang={language}
      tabIndex={tabIndex}
      style={colorStyle}
      onClick={() => onActivate(button)}
      sx={[tileSx, isFolder && folderTileSx]}
    >
      <AACSymbol
        label={button.label}
        imageSrc={button.imageSrc}
        labelPlacement={symbolLabelPlacement}
        isLabelVisible={isLabelVisible}
      />
    </Button>
  );
}

type TileColorStyle = CSSProperties & {
  "--tile-background-color"?: string;
  "--tile-border-color"?: string;
  "--tile-brightness"?: number;
};

interface TileColorOptions {
  backgroundColor: string | undefined;
  borderColor: string | undefined;
  isBorderVisible: boolean;
  saturation: number;
  brightness: number;
}

function tileColorStyle({
  backgroundColor,
  borderColor,
  isBorderVisible,
  saturation,
  brightness,
}: TileColorOptions): TileColorStyle {
  const visibleBorderColor = isBorderVisible ? borderColor : undefined;

  return {
    "--tile-background-color":
      backgroundColor &&
      scaleChroma(flattenOntoWhite(backgroundColor), saturation),
    "--tile-border-color":
      visibleBorderColor && scaleChroma(visibleBorderColor, saturation),
    "--tile-brightness": brightness,
  };
}

// contrast-color() ignores alpha, so a see-through color would get the wrong
// label color. White is the surface OBF boards are authored against.
function flattenOntoWhite(color: string): string {
  return `rgb(from ${color} ${channelOntoWhite("r")} ${channelOntoWhite("g")} ${channelOntoWhite("b")} / 1)`;
}

function channelOntoWhite(channel: "r" | "g" | "b"): string {
  return `calc(${channel} * alpha + 255 * (1 - alpha))`;
}

function scaleChroma(color: string, factor: number): string {
  return `oklch(from ${color} l calc(c * ${factor}) h)`;
}

function tileSx(theme: Theme) {
  const background = tileBackground(theme);
  const borderColor = dim("var(--tile-border-color, transparent)");
  // The shorter side decides, so a wide but short tile keeps its label small
  // and leaves the height to the symbol.
  const labelFontSize = `clamp(${theme.typography.body2.fontSize}, 12cqmin, ${theme.typography.h6.fontSize})`;

  return {
    [SYMBOL_LABEL_FONT_SIZE_PROPERTY]: labelFontSize,
    position: "relative",
    display: "grid",
    containerType: "size",
    alignItems: "stretch",
    justifyContent: "stretch",
    width: "100%",
    height: "100%",
    p: 1,
    overflow: "hidden",
    color: `contrast-color(${background})`,
    backgroundColor: background,
    border: `4px solid ${borderColor}`,
    borderRadius: theme.vars.shape.borderRadius,
    boxShadow: theme.vars.shadows[2],
    // A press shows in the tile's own background, mixed for any tile color,
    // so the theme's press overlay is not drawn.
    "&::before": {
      display: "none",
    },
    "&:hover": {
      "@media (hover: hover)": {
        backgroundColor: mixWithTextColor(background, "8%"),
        boxShadow: theme.vars.shadows[4],
      },
    },
    "&:active": {
      backgroundColor: mixWithTextColor(background, "16%"),
      boxShadow: theme.vars.shadows[8],
    },
    [`&.${buttonClasses.focusVisible}`]: {
      outlineWidth: 3,
      boxShadow: theme.vars.shadows[6],
    },
    "& img": {
      filter: "brightness(var(--tile-brightness))",
      transition: buttonFeedbackTransition(theme, ["filter"]),
    },
  } as const;
}

// The fold mixes toward the tile's text color, so it darkens light tiles and
// lightens dark ones; 60% keeps 3:1 even on saturated mid-tones. Boosting the
// chroma restores some of the hue the mix greys out.
function folderTileSx(theme: Theme) {
  const foldColor = scaleChroma(
    mixWithTextColor(tileBackground(theme), "60%"),
    1.5,
  );

  return {
    "&::after": {
      content: '""',
      position: "absolute",
      top: -2,
      insetInlineEnd: -2,
      width: 0,
      height: 0,
      borderInlineEnd: `32px solid ${foldColor}`,
      borderBottom: "32px solid transparent",
    },
  } as const;
}

function tileBackground(theme: Theme): string {
  return dim(
    `var(--tile-background-color, ${theme.vars.palette.background.paper})`,
  );
}

// Matches the symbol's CSS brightness filter.
function dim(color: string): string {
  const dimmed = (channel: "r" | "g" | "b") =>
    `calc(${channel} * var(--tile-brightness))`;

  return `rgb(from ${color} ${dimmed("r")} ${dimmed("g")} ${dimmed("b")} / alpha)`;
}

function mixWithTextColor(color: string, amount: string): string {
  return `color-mix(in oklab, ${color}, currentColor ${amount})`;
}
