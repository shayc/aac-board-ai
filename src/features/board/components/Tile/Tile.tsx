import { Pictogram } from "@features/board/components/Pictogram/Pictogram";
import Button from "@mui/material/Button";
import { darken } from "@mui/material/styles";
import { getReadableTextColor } from "@shared/utils/colors";

export interface TileProps {
  label?: string;
  imageSrc?: string;
  backgroundColor?: string;
  borderColor?: string;
  disabled?: boolean;
  variant?: "folder";
  onClick: () => void;
}

export function Tile({
  label,
  imageSrc,
  backgroundColor,
  borderColor,
  disabled,
  variant,
  onClick,
}: TileProps) {
  return (
    <Button
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
        padding: 0,
        position: "relative",
        border: `2px solid ${borderColor ?? backgroundColor ?? "transparent"}`,
        borderRadius: 4,
        color: backgroundColor ? getReadableTextColor(backgroundColor) : "inherit",
        backgroundColor,
        borderColor,
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
        "&::after": {
          content: '""',
          display: variant === "folder" ? "block" : "none",
          position: "absolute",
          top: -2,
          right: -2,
          width: 0,
          height: 0,
          borderRight: `24px solid ${borderColor ?? "#000"}`,
          borderBottom: "24px solid transparent",
        },
      })}
    >
      <Pictogram label={label} src={imageSrc} />
    </Button>
  );
}
