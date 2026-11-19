import { m } from "@paraglide/messages.js";
import { HouseIcon } from "@phosphor-icons/react/dist/csr/House";
import { useTranslate } from "@shared/language/use-translate";
import { PhosphorIcon } from "@shared/ui/phosphor-icon";
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
      <PhosphorIcon icon={HouseIcon} />
    </BoardControlButton>
  );
}
