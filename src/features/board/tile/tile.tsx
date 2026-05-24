import Button from "@mui/material/Button";
import { getReadableTextColor } from "@shared/utils/colors";
import { Pictogram } from "../pictogram/pictogram";

export interface TileProps {
  label?: string;
  imageSrc?: string;
  backgroundColor?: string;
  borderColor?: string;
  disabled?: boolean;
  variant?: "folder";
  tabIndex?: number;
  onClick: () => void;
}

export function Tile({
  label,
  imageSrc,
  backgroundColor,
  borderColor,
  disabled,
  variant,
  tabIndex,
  onClick,
}: TileProps) {
  return (
    <Button
      tabIndex={tabIndex}
      disableRipple
      disabled={disabled}
      onClick={onClick}
      sx={(theme) => ({
        width: "100%",
        height: "100%",
        display: "grid",
        alignItems: "stretch",
        justifyContent: "stretch",
        textTransform: "none",
        padding: "4px 4px 0 4px",
        position: "relative",
        border: `2px solid ${borderColor ?? backgroundColor ?? "transparent"}`,
        borderRadius: 4,
        overflow: "hidden",
        color: backgroundColor
          ? getReadableTextColor(backgroundColor)
          : "inherit",
        backgroundColor,
        transition: theme.transitions.create("background-color", {
          duration: theme.transitions.duration.short,
        }),
        "&:hover": {
          backgroundColor: backgroundColor
            ? `color-mix(in srgb, ${backgroundColor}, black 20%)`
            : undefined,
        },
        "&:active": {
          backgroundColor: backgroundColor
            ? `color-mix(in srgb, ${backgroundColor}, black 30%)`
            : undefined,
        },
        "&:focus-visible": {
          outline: `3px solid ${theme.vars?.palette.text.primary ?? theme.palette.text.primary}`,
          outlineOffset: 2,
        },
        "&::after": {
          content: '""',
          display: variant === "folder" ? "block" : "none",
          position: "absolute",
          top: -2,
          insetInlineEnd: -2,
          width: 0,
          height: 0,
          borderInlineEnd: `32px solid ${borderColor ?? "#000"}`,
          borderBottom: "32px solid transparent",
        },
      })}
    >
      <Pictogram label={label} src={imageSrc} />
    </Button>
  );
}
