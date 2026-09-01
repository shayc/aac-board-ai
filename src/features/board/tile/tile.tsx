import Button, { buttonClasses } from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import { AACSymbol } from "../aac-symbol/aac-symbol";
import type { TileLabelPlacement } from "../appearance/appearance-store";

interface TileProps {
  label: string;
  imageSrc?: string;
  backgroundColor?: string;
  borderColor?: string;
  disabled?: boolean;
  variant?: "folder";
  borderHidden?: boolean;
  labelPlacement?: TileLabelPlacement;
  tabIndex?: number;
  onActivate: () => void;
}

function desaturate(color: string): string {
  return `oklch(from ${color} l calc(c * var(--tile-saturation, 1)) h)`;
}

function darken(color: string, percentage: number): string {
  return `color-mix(in srgb, ${color} ${percentage}%, black)`;
}

export function Tile({
  label,
  imageSrc,
  backgroundColor,
  borderColor,
  disabled,
  variant,
  borderHidden,
  labelPlacement,
  tabIndex,
  onActivate,
}: TileProps) {
  const resolvedBorderColor = borderColor ?? backgroundColor;
  const resolvedBackgroundColor = backgroundColor
    ? desaturate(backgroundColor)
    : undefined;

  return (
    <Button
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
          !borderHidden && resolvedBorderColor
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
              resolvedBackgroundColor && darken(resolvedBackgroundColor, 85),
          },
          "@media (hover: none)": {
            boxShadow: (theme.vars ?? theme).shadows[2],
          },
        },
        "&:active": {
          backgroundColor:
            resolvedBackgroundColor && darken(resolvedBackgroundColor, 75),
          boxShadow: (theme.vars ?? theme).shadows[8],
        },
        [`&.${buttonClasses.focusVisible}`]: {
          outline: `4px solid ${
            theme.vars
              ? `rgba(${theme.vars.palette.text.primaryChannel} / 0.8)`
              : alpha(theme.palette.text.primary, 0.8)
          }`,
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
      <AACSymbol
        label={label}
        imageSrc={imageSrc}
        labelPlacement={labelPlacement}
      />
    </Button>
  );
}
