import Button, { buttonClasses, type ButtonProps } from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
import { mergeSx } from "@shared/theme/merge-sx";
import { Pictogram } from "../pictogram/pictogram";

interface TileOwnProps {
  label: string;
  imageSrc?: string;
  backgroundColor?: string;
  borderColor?: string;
  variant?: "folder";
  borderHidden?: boolean;
  onClick: () => void;
}

export type TileProps = TileOwnProps &
  Omit<ButtonProps, keyof TileOwnProps | "children" | "disableRipple">;

// Scale an author-supplied color's OKLCH chroma by the board's saturation
// setting so bright third-party boards can be toned down without shifting hue
// or perceived lightness. The var fallback keeps colors intact outside BoardViewer.
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
  variant,
  borderHidden,
  onClick,
  sx,
  ...buttonProps
}: TileProps) {
  const resolvedBorderColor = borderColor ?? backgroundColor;
  const resolvedBackgroundColor = backgroundColor
    ? desaturate(backgroundColor)
    : undefined;

  return (
    <Button
      {...buttonProps}
      disableRipple
      onClick={onClick}
      sx={mergeSx(
        (theme) => ({
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
                resolvedBackgroundColor && darken(resolvedBackgroundColor, 80),
            },
            "@media (hover: none)": {
              boxShadow: (theme.vars ?? theme).shadows[2],
            },
          },
          "&:active": {
            boxShadow: (theme.vars ?? theme).shadows[8],
            backgroundColor:
              resolvedBackgroundColor && darken(resolvedBackgroundColor, 70),
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
        }),
        sx,
      )}
    >
      <Pictogram label={label} src={imageSrc} />
    </Button>
  );
}
