import Button, { buttonClasses } from "@mui/material/Button";
import type { ReactNode } from "react";

interface TileProps {
  ariaLabel?: string;
  tabIndex?: number;
  children: ReactNode;
  disabled?: boolean;
  variant?: "folder";
  backgroundColor?: string;
  borderColor?: string;
  isBorderVisible?: boolean;
  onActivate: () => void;
}

function desaturate(color: string): string {
  return `oklch(from ${color} l calc(c * var(--tile-saturation, 1)) h)`;
}

function darken(color: string, percentage: number): string {
  return `color-mix(in srgb, ${color} ${100 - percentage}%, black)`;
}

// Tiles read as physical keys: a hairline ring, a 2px bottom edge and a soft
// drop shadow. Outer shadows (not inset) keep the ring on the tile's edge
// instead of 4px inside it, past the border.
const TILE_SHADOW_LIGHT =
  "0 0 0 1px rgb(0 0 0 / 0.10), 0 2px 0 rgb(0 0 0 / 0.10), 0 1px 2px rgb(16 24 40 / 0.06), 0 4px 10px -4px rgb(16 24 40 / 0.14)";
const TILE_SHADOW_DARK =
  "0 0 0 1px rgb(0 0 0 / 0.35), 0 2px 0 rgb(0 0 0 / 0.16), 0 1px 0 rgb(0 0 0 / 0.4), 0 6px 14px -6px rgb(0 0 0 / 0.7)";
const TILE_SHADOW_PRESSED_LIGHT =
  "0 0 0 1px rgb(0 0 0 / 0.10), 0 1px 0 rgb(0 0 0 / 0.10)";
const TILE_SHADOW_PRESSED_DARK =
  "0 0 0 1px rgb(0 0 0 / 0.35), 0 1px 0 rgb(0 0 0 / 0.16)";
const TILE_GLOSS =
  "linear-gradient(180deg, rgb(255 255 255 / 0.3), transparent 45%)";

export function Tile({
  ariaLabel,
  tabIndex,
  children,
  disabled,
  variant,
  backgroundColor,
  borderColor,
  isBorderVisible = true,
  onActivate,
}: TileProps) {
  const resolvedBorderColor = borderColor ?? backgroundColor;
  const resolvedBackgroundColor = backgroundColor
    ? desaturate(backgroundColor)
    : undefined;

  return (
    <Button
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      disabled={disabled}
      disableRipple
      onClick={onActivate}
      sx={(theme) => ({
        position: "relative",
        display: "grid",
        alignItems: "stretch",
        justifyContent: "stretch",
        width: "100%",
        height: "100%",
        p: 1,
        overflow: "hidden",
        textTransform: "none",
        color: resolvedBackgroundColor
          ? `contrast-color(${resolvedBackgroundColor})`
          : "inherit",
        border: `4px solid ${
          isBorderVisible && resolvedBorderColor
            ? desaturate(resolvedBorderColor)
            : "transparent"
        }`,
        borderRadius: 4,
        backgroundColor: resolvedBackgroundColor,
        backgroundImage: resolvedBackgroundColor ? TILE_GLOSS : undefined,
        backgroundOrigin: "border-box",
        boxShadow: TILE_SHADOW_LIGHT,
        transition: theme.transitions.create(
          ["background-color", "box-shadow", "transform"],
          {
            duration: theme.transitions.duration.shortest,
          },
        ),
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
        },
        "&:hover": {
          "@media (hover: hover)": {
            backgroundColor:
              resolvedBackgroundColor && darken(resolvedBackgroundColor, 15),
          },
        },
        "&:active": {
          transform: "translateY(1px)",
          backgroundColor:
            resolvedBackgroundColor && darken(resolvedBackgroundColor, 25),
          boxShadow: TILE_SHADOW_PRESSED_LIGHT,
        },
        [`&.${buttonClasses.focusVisible}`]: {
          outline: `4px solid ${theme.alpha((theme.vars ?? theme).palette.text.primary, 0.8)}`,
          outlineOffset: 2,
        },
        [`&.${buttonClasses.disabled}`]: {
          boxShadow: "none",
        },
        ...theme.applyStyles("dark", {
          boxShadow: TILE_SHADOW_DARK,
          "&:active": {
            boxShadow: TILE_SHADOW_PRESSED_DARK,
          },
        }),
        ...(variant === "folder" && {
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
            // A light edge makes the corner read as a folded page.
            filter: "drop-shadow(-1px 1px 0 rgb(255 255 255 / 0.35))",
          },
        }),
      })}
    >
      {children}
    </Button>
  );
}
