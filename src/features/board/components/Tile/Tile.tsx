import Button from "@mui/material/Button";
import { getReadableTextColor } from "../../../utils/colors";
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
      sx={{
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
      }}
    >
      <Pictogram label={label} src={imageSrc} />
    </Button>
  );
}
