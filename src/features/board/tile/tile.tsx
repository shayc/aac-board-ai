import Button, { buttonClasses } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { buttonFeedbackTransition } from "@shared/theme/button-feedback";
import type { CSSProperties } from "react";
import { AACSymbol } from "../aac-symbol/aac-symbol";
import type { BoardButton } from "../board-types";
import { useTilePreferences } from "./tile-preferences-store";

interface TileProps {
  button: BoardButton;
  tabIndex: number;
  onActivate: (button: BoardButton) => void;
}

type TileColorStyle = CSSProperties & {
  "--tile-background-color"?: string;
  "--tile-border-color"?: string;
  "--tile-brightness"?: number;
};

function channelOntoWhite(channel: "r" | "g" | "b"): string {
  return `calc(${channel} * alpha + 255 * (1 - alpha))`;
}

function flattenOntoWhite(color: string): string {
  return `rgb(from ${color} ${channelOntoWhite("r")} ${channelOntoWhite("g")} ${channelOntoWhite("b")} / 1)`;
}

function desaturate(color: string, saturation: number): string {
  return `oklch(from ${color} l calc(c * ${saturation}) h)`;
}

// The same per-channel multiplication as the `brightness()` filter on the
// tile's symbol, so the symbol and the tile behind it dim by the same amount.
function dim(color: string): string {
  const dimmed = (channel: "r" | "g" | "b") =>
    `calc(${channel} * var(--tile-brightness))`;

  return `rgb(from ${color} ${dimmed("r")} ${dimmed("g")} ${dimmed("b")} / alpha)`;
}

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
      desaturate(flattenOntoWhite(backgroundColor), saturation),
    "--tile-border-color":
      visibleBorderColor && desaturate(visibleBorderColor, saturation),
    "--tile-brightness": brightness,
  };
}

function mixWithTextColor(color: string, amount: string): string {
  return `color-mix(in oklab, ${color}, currentColor ${amount})`;
}

function tileSx(theme: Theme) {
  const background = dim(
    `var(--tile-background-color, ${theme.vars.palette.background.paper})`,
  );
  const borderColor = dim("var(--tile-border-color, transparent)");

  return {
    position: "relative",
    display: "grid",
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
      // The tile's own colors ease with the button feedback timing; without
      // the same easing the symbol would jump ahead of the tile behind it.
      transition: buttonFeedbackTransition(theme, ["filter"]),
    },
  } as const;
}

const folderTileSx = {
  "&::after": {
    content: '""',
    position: "absolute",
    top: -2,
    insetInlineEnd: -2,
    width: 0,
    height: 0,
    borderInlineEnd:
      "32px solid color-mix(in srgb, currentColor 75%, transparent)",
    borderBottom: "32px solid transparent",
  },
} as const;

export function Tile({ button, tabIndex, onActivate }: TileProps) {
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
  const isLabelHidden = labelPlacement === "hidden";

  return (
    <Button
      aria-label={ariaLabel}
      aria-description={isFolder ? t(m.tileOpensBoard) : undefined}
      tabIndex={tabIndex}
      style={colorStyle}
      onClick={() => onActivate(button)}
      sx={[tileSx, isFolder && folderTileSx]}
    >
      <AACSymbol
        label={button.label}
        imageSrc={button.imageSrc}
        labelPlacement={symbolLabelPlacement}
        isLabelHidden={isLabelHidden}
      />
    </Button>
  );
}
