import Button from "@mui/material/Button";
import { darken } from "@mui/material/styles";
import { getReadableTextColor } from "@shared/utils/colors";
import { Pictogram } from "../Pictogram/Pictogram";

export interface TileProps {
  label?: string;
  imageSrc?: string;
  backgroundColor?: string;
  borderColor?: string;
  disabled?: boolean;
  onClick: () => void;
}

export function Tile({
  label,
  imageSrc,
  backgroundColor,
  borderColor,
  disabled,
  onClick,
}: TileProps) {
  return (
    <Button
      disableRipple
      disabled={disabled}
      onClick={onClick}
      sx={(theme) => ({
        backgroundColor,
        borderColor,
        width: "100%",
        height: "100%",
        alignItems: "stretch",
        textTransform: "none",
        padding: 0,
        border: `2px solid ${borderColor ?? "transparent"}`,
        borderRadius: 4,
        color: getReadableTextColor(backgroundColor ?? "#fff"),
        transition: theme.transitions.create("background-color", {
          duration: theme.transitions.duration.short,
        }),
        "&:hover": {
          backgroundColor: backgroundColor
            ? darken(backgroundColor, 0.2)
            : undefined,
        },
        "&:active": {
          backgroundColor: backgroundColor
            ? darken(backgroundColor, 0.3)
            : undefined,
        },
      })}
    >
      <Pictogram label={label} src={imageSrc} />
    </Button>
  );
}
