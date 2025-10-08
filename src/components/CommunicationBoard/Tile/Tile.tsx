import Button from "@mui/material/Button";
import { Pictogram } from "../Pictogram/Pictogram";

export interface TileProps {
  label?: string;
  imageSrc?: string;
  backgroundColor?: string;
  borderColor?: string;
  disabled?: boolean;
  onClick: () => void;
}

export function Tile(props: TileProps) {
  const { label, imageSrc, backgroundColor, borderColor, disabled, onClick } =
    props;

  return (
    <Button
      disableRipple
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: "100%",
        height: "100%",
        backgroundColor,
        borderColor,
      }}
    >
      <Pictogram label={label} src={imageSrc} />
    </Button>
  );
}
