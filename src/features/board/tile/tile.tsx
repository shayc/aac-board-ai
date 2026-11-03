import Button, { buttonClasses } from "@mui/material/Button";
import GlobalStyles from "@mui/material/GlobalStyles";
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

function adjustColor(color: string): string {
  const brightness = "var(--tile-brightness, 1)";
  const saturation = "var(--tile-saturation, 1)";
  return `oklch(from ${color} calc(l * ${brightness}) calc(c * ${saturation} * ${brightness}) h)`;
}

function folderCornerColor(backgroundColor: string | undefined): string {
  const ink = backgroundColor
    ? `contrast-color(${backgroundColor})`
    : "currentColor";
  return `color-mix(in srgb, ${ink} 75%, transparent)`;
}

export function TileDarkeningProperty() {
  return (
    <GlobalStyles
      styles={{
        "@property --tile-darkening": {
          syntax: "'<percentage>'",
          inherits: String(false),
          initialValue: "0%",
        },
      }}
    />
  );
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
    ? adjustColor(backgroundColor)
    : undefined;

  return (
    <Button
      aria-label={ariaLabel}
      aria-description={variant === "folder" ? t(m.tileOpensBoard) : undefined}
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
            ? adjustColor(resolvedBorderColor)
            : "transparent"
        }`,
        borderRadius: (theme.vars ?? theme).shape.borderRadius,
        backgroundColor:
          resolvedBackgroundColor &&
          `color-mix(in xyz, ${resolvedBackgroundColor}, black var(--tile-darkening, 0%))`,
        boxShadow: (theme.vars ?? theme).shadows[2],
        transition: theme.transitions.create(
          ["--tile-darkening", "box-shadow"],
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
            "--tile-darkening": `calc(${(theme.vars ?? theme).palette.action.hoverOpacity} * 400%)`,
          },
          "@media (hover: none)": {
            boxShadow: (theme.vars ?? theme).shadows[2],
          },
        },
        "&:active": {
          "--tile-darkening": "45%",
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
            borderInlineEnd: `32px solid ${folderCornerColor(backgroundColor)}`,
            borderBottom: "32px solid transparent",
          },
        }),
      })}
    >
      {children}
    </Button>
  );
}
