import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import {
  BoardControlButton,
  type BoardControlShape,
} from "../board-control-button";

interface HomeButtonProps {
  disabled: boolean;
  shape?: BoardControlShape;
  onClick: () => void;
}

export function HomeButton({ disabled, shape, onClick }: HomeButtonProps) {
  const t = useTranslate();

  return (
    <BoardControlButton
      aria-label={t(m.navHome)}
      disabled={disabled}
      shape={shape}
      onClick={onClick}
    >
      <HomeOutlinedIcon />
    </BoardControlButton>
  );
}
