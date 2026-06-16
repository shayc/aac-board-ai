import Button from "@mui/material/Button";
import { alpha } from "@mui/material/styles";
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
  const darkened = (percent: number) =>
    backgroundColor
      ? `color-mix(in srgb, ${backgroundColor}, black ${percent}%)`
      : undefined;

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
        padding: "4px 4px 0 4px",
        border: `2px solid ${borderColor ?? backgroundColor ?? "transparent"}`,
        borderRadius: 4,
        overflow: "hidden",
        position: "relative",
        textTransform: "none",
        color: backgroundColor
          ? getReadableTextColor(backgroundColor)
          : "inherit",
        backgroundColor,
        transition: theme.transitions.create("background-color", {
          duration: theme.transitions.duration.short,
        }),
        "@media (hover: hover)": {
          "&:hover": { backgroundColor: darkened(20) },
        },
        "&:active": { backgroundColor: darkened(30) },
        "&:focus-visible": {
          outline: `3px solid ${
            theme.vars
              ? `rgba(${theme.vars.palette.text.primaryChannel} / 0.8)`
              : alpha(theme.palette.text.primary, 0.8)
          }`,
          outlineOffset: 2,
        },
        ...(variant === "folder" && {
          "&::after": {
            content: '""',
            position: "absolute",
            top: -2,
            insetInlineEnd: -2,
            width: 0,
            height: 0,
            borderInlineEnd: `32px solid ${borderColor ?? "#000"}`,
            borderBottom: "32px solid transparent",
          },
        }),
      })}
    >
      <Pictogram label={label} src={imageSrc} />
    </Button>
  );
}
