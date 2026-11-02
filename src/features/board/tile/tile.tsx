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

// Tiles are the only raised elements: the chrome around them is flat, so
// depth marks what you communicate with. They press in when activated.
// Hover tints about as much as MUI's hover overlay; the lift carries the cue.
const TILE_ELEVATION = {
  light: {
    rest: "0 1px 2px rgb(16 24 40 / 0.08), 0 2px 6px rgb(16 24 40 / 0.10)",
    hover: "0 2px 4px rgb(16 24 40 / 0.10), 0 6px 14px rgb(16 24 40 / 0.14)",
    pressed: "0 1px 1px rgb(16 24 40 / 0.10)",
  },
  dark: {
    rest: "0 1px 2px rgb(0 0 0 / 0.6), 0 3px 8px rgb(0 0 0 / 0.45)",
    hover: "0 2px 4px rgb(0 0 0 / 0.6), 0 8px 18px rgb(0 0 0 / 0.55)",
    pressed: "0 1px 1px rgb(0 0 0 / 0.6)",
  },
};

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
        boxShadow: TILE_ELEVATION.light.rest,
        transition: theme.transitions.create(
          ["background-color", "box-shadow"],
          {
            duration: theme.transitions.duration.short,
          },
        ),
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
        },
        "&:hover": {
          "@media (hover: hover)": {
            backgroundColor:
              resolvedBackgroundColor && darken(resolvedBackgroundColor, 6),
            boxShadow: TILE_ELEVATION.light.hover,
          },
        },
        "&:active": {
          backgroundColor:
            resolvedBackgroundColor && darken(resolvedBackgroundColor, 12),
          boxShadow: TILE_ELEVATION.light.pressed,
        },
        ...theme.applyStyles("dark", {
          boxShadow: TILE_ELEVATION.dark.rest,
          "&:hover": {
            "@media (hover: hover)": {
              boxShadow: TILE_ELEVATION.dark.hover,
            },
          },
          "&:active": {
            boxShadow: TILE_ELEVATION.dark.pressed,
          },
        }),
        [`&.${buttonClasses.focusVisible}`]: {
          outline: `4px solid ${theme.alpha((theme.vars ?? theme).palette.text.primary, 0.8)}`,
          outlineOffset: 2,
        },
        [`&.${buttonClasses.disabled}`]: {
          boxShadow: "none",
        },
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
          },
        }),
      })}
    >
      {children}
    </Button>
  );
}
