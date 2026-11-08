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

const TILE_BACKGROUND_COLOR = "var(--tile-background-color)";

function desaturate(color: string): string {
  return `oklch(from ${color} l calc(c * var(--tile-saturation, 1)) h)`;
}

function darken(color: string, amount: string): string {
  return `color-mix(in srgb, ${color}, black ${amount})`;
}

function tileSx(theme: Theme) {
  return {
    position: "relative",
    display: "grid",
    alignItems: "stretch",
    justifyContent: "stretch",
    width: "100%",
    height: "100%",
    p: 1,
    overflow: "hidden",
    color: "inherit",
    border: "4px solid var(--tile-border-color, transparent)",
    borderRadius: theme.vars.shape.borderRadius,
    boxShadow: theme.vars.shadows[2],
    "&::before": {
      display: "none",
    },
    "&:hover": {
      boxShadow: theme.vars.shadows[4],
      "@media (hover: none)": {
        boxShadow: theme.vars.shadows[2],
      },
    },
    "&:active": {
      boxShadow: theme.vars.shadows[8],
    },
    [`&.${buttonClasses.focusVisible}`]: {
      outlineWidth: 3,
      boxShadow: theme.vars.shadows[6],
    },
  } as const;
}

function coloredTileSx(theme: Theme) {
  return {
    color: `contrast-color(${TILE_BACKGROUND_COLOR})`,
    backgroundColor: TILE_BACKGROUND_COLOR,
    "&:hover": {
      "@media (hover: hover)": {
        backgroundColor: darken(
          TILE_BACKGROUND_COLOR,
          `calc(${theme.vars.palette.action.hoverOpacity} * 200%)`,
        ),
      },
    },
    "&:active": {
      backgroundColor: darken(TILE_BACKGROUND_COLOR, "25%"),
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

function tileColorStyle(
  backgroundColor: string | undefined,
  borderColor: string | undefined,
  isBorderVisible: boolean,
): TileColorStyle {
  const visibleBorderColor = isBorderVisible
    ? (borderColor ?? backgroundColor)
    : undefined;

  return {
    "--tile-background-color": backgroundColor && desaturate(backgroundColor),
    "--tile-border-color": visibleBorderColor && desaturate(visibleBorderColor),
  };
}

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
      sx={[
        tileSx,
        Boolean(backgroundColor) && coloredTileSx,
        isFolder && folderTileSx,
      ]}
    >
      {children}
    </Button>
  );
}
