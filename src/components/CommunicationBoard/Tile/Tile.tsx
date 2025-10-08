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
      type="button"
      disabled={disabled}
      onClick={onClick}
      sx={{ backgroundColor, borderColor }}
    >
      <Pictogram label={label} src={imageSrc} />
    </Button>
  );
}
