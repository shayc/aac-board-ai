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

// Dark mode caps tile lightness so the grid doesn't glare, keeping each hue.
function dim(color: string): string {
  return `oklch(from ${color} min(l, 0.82) c h)`;
}

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
  const fill = backgroundColor ? "var(--tile-fill)" : undefined;
  const resolvedBorderColor = borderColor ? "var(--tile-border)" : fill;

  return (
    <Button
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      disabled={disabled}
      disableRipple
      onClick={onActivate}
      sx={(theme) => ({
        ...(backgroundColor && { "--tile-fill": desaturate(backgroundColor) }),
        ...(borderColor && { "--tile-border": desaturate(borderColor) }),
        ...theme.applyStyles("dark", {
          ...(backgroundColor && {
            "--tile-fill": dim(desaturate(backgroundColor)),
          }),
          ...(borderColor && { "--tile-border": dim(desaturate(borderColor)) }),
        }),
        position: "relative",
        display: "grid",
        alignItems: "stretch",
        justifyContent: "stretch",
        width: "100%",
        height: "100%",
        p: 1,
        overflow: "hidden",
        textTransform: "none",
        color: fill ? `contrast-color(${fill})` : "inherit",
        border: `4px solid ${
          isBorderVisible && resolvedBorderColor
            ? resolvedBorderColor
            : "transparent"
        }`,
        borderRadius: 4,
        backgroundColor: fill,
        // A hairline edge, like the rest of the chrome, instead of elevation.
        boxShadow: `0 0 0 1px ${(theme.vars ?? theme).palette.divider}`,
        transition: theme.transitions.create("background-color", {
          duration: theme.transitions.duration.short,
        }),
        "@media (prefers-reduced-motion: reduce)": {
          transition: "none",
        },
        "&:hover": {
          "@media (hover: hover)": {
            backgroundColor: fill && darken(fill, 15),
          },
        },
        "&:active": {
          backgroundColor: fill && darken(fill, 25),
        },
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
