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
  onClick: () => void;
}

// Scale an author-supplied color's OKLCH chroma by the board's saturation
// setting so bright third-party boards can be toned down without shifting hue
// or perceived lightness. The var fallback keeps colors intact outside CommunicationBoard.
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
  onClick,
}: TileProps) {
  const resolvedBorderColor = borderColor ?? backgroundColor;
  const resolvedBackgroundColor = backgroundColor
    ? desaturate(backgroundColor)
    : undefined;

  return (
    <Button
      disableRipple
      disabled={disabled}
      tabIndex={tabIndex}
      onClick={onClick}
      sx={(theme) => ({
        boxShadow: (theme.vars ?? theme).shadows[2],
        width: "100%",
        height: "100%",
        display: "grid",
        alignItems: "stretch",
        justifyContent: "stretch",
        p: 1,
        border: `4px solid ${
          !borderHidden && resolvedBorderColor
            ? desaturate(resolvedBorderColor)
            : "transparent"
        }`,
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
        textTransform: "none",
        color: resolvedBackgroundColor
          ? `contrast-color(${resolvedBackgroundColor})`
          : "inherit",
        backgroundColor: resolvedBackgroundColor,
        transition: theme.transitions.create(
          ["background-color", "box-shadow"],
          {
            duration: theme.transitions.duration.short,
          },
        ),
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
          boxShadow: (theme.vars ?? theme).shadows[8],
          backgroundColor:
            resolvedBackgroundColor && darken(resolvedBackgroundColor, 75),
        },
        [`&.${buttonClasses.focusVisible}`]: {
          boxShadow: (theme.vars ?? theme).shadows[6],
          outline: `4px solid ${
            theme.vars
              ? `rgba(${theme.vars.palette.text.primaryChannel} / 0.8)`
              : alpha(theme.palette.text.primary, 0.8)
          }`,
          outlineOffset: 2,
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
