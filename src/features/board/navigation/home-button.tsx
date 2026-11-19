import HomeIcon from "@material-symbols/svg-600/rounded/home.svg?react";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { MaterialIcon } from "@shared/ui/material-icon";
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
      <MaterialIcon svg={HomeIcon} />
    </BoardControlButton>
  );
}
