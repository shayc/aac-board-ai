import Button, { buttonClasses } from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import { Pictogram } from "../pictogram/pictogram";

export interface TileProps {
  label: string;
  imageSrc?: string;
  backgroundColor?: string;
  borderColor?: string;
  disabled?: boolean;
  variant?: "folder";
  borderHidden?: boolean;
  tabIndex?: number;
  onClick: () => void;
}

// Scale an author-supplied color's OKLCH chroma by the board's saturation
// setting so bright third-party boards can be toned down without shifting hue
// or perceived lightness. The var fallback keeps colors intact outside BoardViewer.
function desaturate(color: string): string {
  return `oklch(from ${color} l calc(c * var(--tile-saturation, 1)) h)`;
}

export function Tile({
  label,
  imageSrc,
  backgroundColor,
  borderColor,
  disabled,
  variant,
  borderHidden,
  tabIndex,
  onClick,
}: TileProps) {
  const resolvedBorderColor = borderColor ?? backgroundColor;

  return (
    <Button
      tabIndex={tabIndex}
      disableRipple
      disabled={disabled}
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
        color: backgroundColor
          ? `contrast-color(${desaturate(backgroundColor)})`
          : "inherit",
        backgroundColor: backgroundColor && desaturate(backgroundColor),
        transition: theme.transitions.create(["filter", "box-shadow"], {
          duration: theme.transitions.duration.short,
        }),
        "&:hover": {
          boxShadow: (theme.vars ?? theme).shadows[4],
          "@media (hover: hover)": {
            filter: "brightness(0.8)",
          },
          "@media (hover: none)": {
            boxShadow: (theme.vars ?? theme).shadows[2],
          },
        },
        "&:active": {
          boxShadow: (theme.vars ?? theme).shadows[8],
          filter: "brightness(0.7)",
        },
        [`&.${buttonClasses.focusVisible}`]: {
          boxShadow: (theme.vars ?? theme).shadows[6],
          outline: `3px solid ${
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
            borderInlineEnd: `32px solid ${borderColor ? desaturate(borderColor) : "#000"}`,
            borderBottom: "32px solid transparent",
          },
        }),
      })}
    >
      <Pictogram label={label} src={imageSrc} />
    </Button>
  );
}
