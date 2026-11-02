import Button, { buttonClasses } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
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

// Tints scale with MUI's hover opacity, which doubles in dark mode.
function darken(theme: Theme, color: string, hoverMultiple: number): string {
  const opacity = (theme.vars ?? theme).palette.action.hoverOpacity;

  return `color-mix(in srgb, ${color} calc(100% - ${opacity} * ${hoverMultiple * 100}%), black)`;
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
        boxShadow: (theme.vars ?? theme).shadows[2],
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
          boxShadow: (theme.vars ?? theme).shadows[4],
          "@media (hover: hover)": {
            backgroundColor:
              resolvedBackgroundColor &&
              darken(theme, resolvedBackgroundColor, 1.5),
          },
          "@media (hover: none)": {
            boxShadow: (theme.vars ?? theme).shadows[2],
          },
        },
        "&:active": {
          backgroundColor:
            resolvedBackgroundColor &&
            darken(theme, resolvedBackgroundColor, 3),
          boxShadow: (theme.vars ?? theme).shadows[8],
        },
        [`&.${buttonClasses.focusVisible}`]: {
          outline: `4px solid ${theme.alpha((theme.vars ?? theme).palette.text.primary, 0.8)}`,
          outlineOffset: 2,
          boxShadow: (theme.vars ?? theme).shadows[6],
        },
        [`&.${buttonClasses.disabled}`]: {
          boxShadow: (theme.vars ?? theme).shadows[0],
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
