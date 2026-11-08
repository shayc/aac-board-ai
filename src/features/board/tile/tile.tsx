import Button, { buttonClasses } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { CSSProperties, ReactNode } from "react";

interface TileProps {
  ariaLabel?: string;
  tabIndex?: number;
  isFolder?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  isBorderVisible?: boolean;
  children: ReactNode;
  onActivate: () => void;
}

type TileColorStyle = CSSProperties & {
  "--tile-background-color"?: string;
  "--tile-border-color"?: string;
};

function channelOnWhite(channel: string): string {
  return `calc(${channel} * alpha + 255 * (1 - alpha))`;
}

function flattenOntoWhite(color: string): string {
  return `rgb(from ${color} ${channelOnWhite("r")} ${channelOnWhite("g")} ${channelOnWhite("b")} / 1)`;
}

function desaturate(color: string): string {
  return `oklch(from ${color} l calc(c * var(--tile-saturation, 1)) h)`;
}

function tileColor(color: string): string {
  return desaturate(flattenOntoWhite(color));
}

function tileColorStyle(
  backgroundColor: string | undefined,
  borderColor: string | undefined,
  isBorderVisible: boolean,
): TileColorStyle {
  const visibleBorderColor = isBorderVisible
    ? (borderColor ?? backgroundColor)
    : undefined;

  return {
    "--tile-background-color": backgroundColor && tileColor(backgroundColor),
    "--tile-border-color": visibleBorderColor && tileColor(visibleBorderColor),
  };
}

function mixWithTextColor(color: string, amount: string): string {
  return `color-mix(in oklab, ${color}, currentColor ${amount})`;
}

function tileSx(theme: Theme) {
  const backgroundColor = `var(--tile-background-color, ${theme.vars.palette.background.paper})`;

  return {
    position: "relative",
    display: "grid",
    alignItems: "stretch",
    justifyContent: "stretch",
    width: "100%",
    height: "100%",
    p: 1,
    overflow: "hidden",
    color: `contrast-color(${backgroundColor})`,
    backgroundColor,
    border: "4px solid var(--tile-border-color, transparent)",
    borderRadius: theme.vars.shape.borderRadius,
    boxShadow: theme.vars.shadows[2],
    "&::before": {
      display: "none",
    },
    "&:hover": {
      "@media (hover: hover)": {
        backgroundColor: mixWithTextColor(backgroundColor, "8%"),
        boxShadow: theme.vars.shadows[4],
      },
    },
    "&:active": {
      backgroundColor: mixWithTextColor(backgroundColor, "16%"),
      boxShadow: theme.vars.shadows[8],
    },
    [`&.${buttonClasses.focusVisible}`]: {
      outlineWidth: 3,
      boxShadow: theme.vars.shadows[6],
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

export function Tile({
  ariaLabel,
  tabIndex,
  isFolder = false,
  backgroundColor,
  borderColor,
  isBorderVisible = false,
  children,
  onActivate,
}: TileProps) {
  const t = useTranslate();

  return (
    <Button
      aria-label={ariaLabel}
      aria-description={isFolder ? t(m.tileOpensBoard) : undefined}
      tabIndex={tabIndex}
      onClick={onActivate}
      style={tileColorStyle(backgroundColor, borderColor, isBorderVisible)}
      sx={[tileSx, isFolder && folderTileSx]}
    >
      {children}
    </Button>
  );
}
