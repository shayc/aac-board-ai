import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { HomeIcon } from "@shared/ui/icons";
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
      <HomeIcon />
    </BoardControlButton>
  );
}
