import Button, { buttonClasses } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
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

const FOLDER_TAB_DEPTH_PX = 12;
const FOLDER_FRONT_TOP_PX = 17;

const folderBackShape = `shape(from 0 0, hline to calc(38% - 10px), curve to calc(38% + 6px) 7px with 38% 0, curve to calc(38% + 22px) ${FOLDER_TAB_DEPTH_PX}px with calc(38% + 12px) ${FOLDER_TAB_DEPTH_PX}px, hline to calc(100% - 16px), curve to 100% ${FOLDER_TAB_DEPTH_PX + 16}px with 100% ${FOLDER_TAB_DEPTH_PX}px, vline to 100%, hline to 0, close)`;

function desaturate(color: string): string {
  return `oklch(from ${color} l calc(c * var(--tile-saturation, 1)) h)`;
}

function darken(color: string, amount: string): string {
  return `color-mix(in srgb, ${color}, black ${amount})`;
}

function folderSx(theme: Theme, border: string) {
  const fill = `var(--tile-fill, ${theme.vars.palette.background.paper})`;
  const { borderRadius, borderRadiusSm } = theme.vars.shape;

  return {
    isolation: "isolate",
    borderWidth: 0,
    p: 1.5,
    pt: `${FOLDER_FRONT_TOP_PX + 8}px`,
    backgroundColor: "transparent",
    filter:
      "drop-shadow(0 1px 1px rgb(16 24 40 / 0.08)) drop-shadow(0 3px 5px rgb(16 24 40 / 0.1))",
    [`&, &:hover, &:active, &.${buttonClasses.focusVisible}`]: {
      boxShadow: "none",
    },
    "&::before, &::after": {
      content: '""',
      position: "absolute",
      zIndex: -1,
    },
    "&::before": {
      inset: 0,
      clipPath: folderBackShape,
      backgroundColor: darken(fill, "20%"),
    },
    "&::after": {
      inset: `${FOLDER_FRONT_TOP_PX}px 0 0`,
      border,
      borderRadius: `${borderRadiusSm} ${borderRadiusSm} ${borderRadius} ${borderRadius}`,
      backgroundColor: fill,
      boxShadow: "0 -1px 2px rgb(16 24 40 / 0.12)",
    },
  } as const;
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
  const border = `4px solid ${
    isBorderVisible && resolvedBorderColor
      ? desaturate(resolvedBorderColor)
      : "transparent"
  }`;

  return (
    <Button
      aria-label={ariaLabel}
      aria-description={variant === "folder" ? t(m.tileOpensBoard) : undefined}
      tabIndex={tabIndex}
      disabled={disabled}
      disableRipple
      onClick={onActivate}
      sx={(theme) => ({
        "--tile-fill": resolvedBackgroundColor,
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
        border,
        borderRadius: theme.vars.shape.borderRadius,
        backgroundColor: "var(--tile-fill)",
        boxShadow: theme.vars.shadows[2],
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
          boxShadow: theme.vars.shadows[4],
          "@media (hover: hover)": {
            "--tile-fill":
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
          "--tile-fill":
            resolvedBackgroundColor && darken(resolvedBackgroundColor, "25%"),
          boxShadow: theme.vars.shadows[8],
        },
        [`&.${buttonClasses.focusVisible}`]: {
          outline: `4px solid ${theme.alpha(theme.vars.palette.text.primary, 0.8)}`,
          outlineOffset: 2,
          boxShadow: theme.vars.shadows[6],
        },
        [`&.${buttonClasses.disabled}`]: {
          boxShadow: theme.vars.shadows[0],
        },
        ...(variant === "folder" && folderSx(theme, border)),
      })}
    >
      {children}
    </Button>
  );
}
