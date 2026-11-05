import Button, { buttonClasses } from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
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

const feedbackTransitionProperty =
  "background-color, box-shadow, border-color, color";

function desaturate(color: string): string {
  return `oklch(from ${color} l calc(c * var(--tile-saturation, 1)) h)`;
}

function darken(color: string, amount: string): string {
  return `color-mix(in srgb, ${color}, black ${amount})`;
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
  const t = useTranslate();

  const resolvedBorderColor = borderColor ?? backgroundColor;
  const resolvedBackgroundColor = backgroundColor
    ? desaturate(backgroundColor)
    : undefined;

  return (
    <Button
      aria-label={ariaLabel}
      aria-description={variant === "folder" ? t(m.tileOpensBoard) : undefined}
      tabIndex={tabIndex}
      disabled={disabled}
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
        borderRadius: theme.vars.shape.borderRadius,
        backgroundColor: resolvedBackgroundColor,
        boxShadow: theme.vars.shadows[2],
        transitionProperty: "box-shadow, border-color, color",
        "&::before": {
          display: "none",
        },
        "&:hover": {
          boxShadow: theme.vars.shadows[4],
          transitionProperty: feedbackTransitionProperty,
          "@media (hover: hover)": {
            backgroundColor:
              resolvedBackgroundColor &&
              darken(
                resolvedBackgroundColor,
                `calc(${theme.vars.palette.action.hoverOpacity} * 200%)`,
              ),
          },
          "@media (hover: none)": {
            boxShadow: theme.vars.shadows[2],
          },
        },
        "&:active": {
          backgroundColor:
            resolvedBackgroundColor && darken(resolvedBackgroundColor, "25%"),
          boxShadow: theme.vars.shadows[8],
          transitionProperty: feedbackTransitionProperty,
        },
        [`&.${buttonClasses.focusVisible}`]: {
          outlineWidth: 3,
          boxShadow: theme.vars.shadows[6],
        },
        [`&.${buttonClasses.disabled}`]: {
          boxShadow: theme.vars.shadows[0],
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
