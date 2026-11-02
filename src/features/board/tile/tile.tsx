import Box from "@mui/material/Box";
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

// Dark mode caps each tile's lightness so the grid stops glaring while the
// Fitzgerald hues stay recognizable. min() leaves already-dark tiles alone.
function dim(color: string, maxLightness: number): string {
  return `oklch(from ${color} min(l, ${maxLightness}) calc(c * 0.95) h)`;
}

// Labels use a shade of the tile's own hue: deep on light
// tiles, pale on dark ones, so contrast holds for any board's colors.
function ink(color: string): string {
  return `oklch(from ${color} calc(0.685 - 0.265 * sign(l - 0.6)) calc(c * 1.6) h)`;
}

const TILE_RADIUS = 30;
const TILE_RADIUS_FALLBACK = 16;

const TILE_BORDER_WIDTH = 4;

// Folder tiles take a folder silhouette (tab on the leading side) instead of
// a corner triangle, so folders read by shape, not by a small mark. `inset`
// draws the same outline shrunk inward, for the fill inside a visible border.
function folderShape(inset: number): string {
  const radius = 18 - inset;
  const step = 10 - inset;

  return `shape(from 0 ${radius}px, curve to ${radius}px 0 with 0 0, hline to calc(42% - 12px), curve to calc(42% + 4px) ${step}px with 42% 0, hline to calc(100% - ${radius}px), curve to 100% ${step + radius}px with 100% ${step}px, vline to calc(100% - ${radius}px), curve to calc(100% - ${radius}px) 100% with 100% 100%, hline to ${radius}px, curve to 0 calc(100% - ${radius}px) with 0 100%, close)`;
}

const SUPPORTS_SHAPE = "@supports (clip-path: shape(from 0 0, line to 1px 0))";

const TILE_SHADOW_LIGHT =
  "0 0 0 1px rgb(0 0 0 / 0.10), 0 2px 0 rgb(0 0 0 / 0.10), 0 1px 2px rgb(16 24 40 / 0.06), 0 4px 10px -4px rgb(16 24 40 / 0.14)";
const TILE_SHADOW_PRESSED_LIGHT =
  "0 0 0 1px rgb(0 0 0 / 0.10), 0 1px 0 rgb(0 0 0 / 0.10)";
const TILE_DROP_DARK = "0 8px 18px -10px rgb(0 0 0 / 0.9)";
const TILE_GLOSS =
  "linear-gradient(180deg, rgb(255 255 255 / 0.28), transparent 45%)";

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
  const resolvedBackgroundColor = backgroundColor
    ? desaturate(backgroundColor)
    : undefined;
  const resolvedBorderColor = borderColor
    ? desaturate(borderColor)
    : resolvedBackgroundColor;
  const isFolder = variant === "folder";
  // A CSS border follows the box, not the clip-path, so a visible border on a
  // folder tile is painted by a frame that carries the folder outline.
  const isFolderFramed =
    isFolder && isBorderVisible && Boolean(resolvedBorderColor);

  const button = (
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
          ? ink(resolvedBackgroundColor)
          : "inherit",
        border: `${TILE_BORDER_WIDTH}px solid ${
          isBorderVisible && resolvedBorderColor
            ? resolvedBorderColor
            : "transparent"
        }`,
        borderRadius: `${TILE_RADIUS_FALLBACK}px`,
        backgroundColor: resolvedBackgroundColor,
        backgroundImage: resolvedBackgroundColor ? TILE_GLOSS : undefined,
        backgroundOrigin: "border-box",
        boxShadow: TILE_SHADOW_LIGHT,
        transition: theme.transitions.create(
          ["background-color", "box-shadow", "transform"],
          {
            duration: theme.transitions.duration.short,
          },
        ),
        "@supports (corner-shape: squircle)": {
          borderRadius: `${TILE_RADIUS}px`,
          cornerShape: "squircle",
        },
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
        ...(resolvedBackgroundColor &&
          theme.applyStyles("dark", {
            color: ink(dim(resolvedBackgroundColor, 0.86)),
            backgroundColor: dim(resolvedBackgroundColor, 0.86),
            borderColor:
              isBorderVisible && !borderColor
                ? dim(resolvedBackgroundColor, 0.86)
                : undefined,
            boxShadow: TILE_DROP_DARK,
            "&:hover": {
              "@media (hover: hover)": {
                backgroundColor: dim(resolvedBackgroundColor, 0.8),
              },
            },
            "&:active": {
              backgroundColor: dim(resolvedBackgroundColor, 0.76),
              boxShadow: "none",
            },
          })),
        ...(isFolder && {
          // Fallback marker for browsers without shape(): a corner fold.
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
          [SUPPORTS_SHAPE]: {
            borderRadius: 0,
            clipPath: folderShape(0),
            ...(isFolderFramed && {
              borderWidth: 0,
              clipPath: folderShape(TILE_BORDER_WIDTH),
            }),
            "&::after": {
              display: "none",
            },
            // clip-path would cut an outside focus ring; draw it inside.
            [`&.${buttonClasses.focusVisible}`]: {
              outlineOffset: -8,
            },
          },
        }),
      })}
    >
      {children}
    </Button>
  );

  if (!isFolderFramed) {
    return button;
  }

  return (
    <Box
      sx={(theme) => ({
        display: "grid",
        width: "100%",
        height: "100%",
        [SUPPORTS_SHAPE]: {
          p: `${TILE_BORDER_WIDTH}px`,
          backgroundColor: resolvedBorderColor,
          clipPath: folderShape(0),
          ...(resolvedBackgroundColor &&
            !borderColor &&
            theme.applyStyles("dark", {
              backgroundColor: dim(resolvedBackgroundColor, 0.86),
            })),
        },
      })}
    >
      {button}
    </Box>
  );
}
