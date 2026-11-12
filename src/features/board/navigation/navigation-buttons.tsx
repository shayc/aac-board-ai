import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { BoardControlButton } from "../board-control-button";

interface NavigationButtonsProps {
  canGoBack: boolean;
  canGoHome: boolean;
  onBack: () => void;
  onHome: () => void;
}

export function NavigationButtons({
  canGoBack,
  canGoHome,
  onBack,
  onHome,
}: NavigationButtonsProps) {
  const t = useTranslate();

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <BoardControlButton
        aria-label={t(m.navBack)}
        disabled={!canGoBack}
        onClick={onBack}
      >
        <ArrowBackOutlinedIcon sx={flipForRTL} />
      </BoardControlButton>

      <BoardControlButton
        aria-label={t(m.navHome)}
        disabled={!canGoHome}
        onClick={onHome}
      >
        <HomeOutlinedIcon />
      </BoardControlButton>
    </Box>
  );
}
