import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import {
  BoardControlButton,
  type BoardControlShape,
} from "../board-control-button";

interface NavigationButtonsProps {
  canGoBack: boolean;
  canGoHome: boolean;
  shape?: BoardControlShape;
  onBack: () => void;
  onHome: () => void;
}

export function NavigationButtons({
  canGoBack,
  canGoHome,
  shape,
  onBack,
  onHome,
}: NavigationButtonsProps) {
  const t = useTranslate();

  return (
    <>
      <BoardControlButton
        aria-label={t(m.navBack)}
        disabled={!canGoBack}
        shape={shape}
        onClick={onBack}
      >
        <ArrowBackOutlinedIcon sx={flipForRTL} />
      </BoardControlButton>

      <BoardControlButton
        aria-label={t(m.navHome)}
        disabled={!canGoHome}
        shape={shape}
        onClick={onHome}
      >
        <HomeOutlinedIcon />
      </BoardControlButton>
    </>
  );
}
