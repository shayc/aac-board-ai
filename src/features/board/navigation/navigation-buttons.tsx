import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { BoardControlButton } from "../board-control-button";
import { MESSAGE_SECONDARY_ACTION_SIZE } from "../message/message-bar";

// Beside the message bar the buttons match its backspace disc.
const ROUND_SX = {
  width: MESSAGE_SECONDARY_ACTION_SIZE,
  minWidth: 0,
  height: MESSAGE_SECONDARY_ACTION_SIZE,
  p: 0,
} as const;

interface NavigationButtonsProps {
  shape?: "pill" | "round";
  canGoBack: boolean;
  canGoHome: boolean;
  onBack: () => void;
  onHome: () => void;
}

export function NavigationButtons({
  shape = "pill",
  canGoBack,
  canGoHome,
  onBack,
  onHome,
}: NavigationButtonsProps) {
  const t = useTranslate();
  const buttonSx = shape === "round" ? ROUND_SX : undefined;

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <BoardControlButton
        aria-label={t(m.navBack)}
        disabled={!canGoBack}
        onClick={onBack}
        sx={buttonSx}
      >
        <ArrowBackOutlinedIcon sx={flipForRTL} />
      </BoardControlButton>

      <BoardControlButton
        aria-label={t(m.navHome)}
        disabled={!canGoHome}
        onClick={onHome}
        sx={buttonSx}
      >
        <HomeOutlinedIcon />
      </BoardControlButton>
    </Box>
  );
}
