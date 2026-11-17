import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
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

  // Pills are laid out by the row they share with play, so their wrapper
  // steps out of the layout.
  const display = shape === "pill" ? "contents" : "flex";

  return (
    <Box sx={{ display, gap: 1 }}>
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
    </Box>
  );
}
