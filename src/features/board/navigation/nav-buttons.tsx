import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRtl } from "@shared/theme/rtl";
import { useBoardNavigation } from "./use-board-navigation";

interface NavButtonsProps {
  onBack?: () => void;
  onHome?: () => void;
}

export function NavButtons({ onBack, onHome }: NavButtonsProps = {}) {
  const t = useTranslate();
  const { setId, canGoBack, canGoHome, isHome, goBack, goHome } =
    useBoardNavigation();

  if (!setId) {
    return null;
  }

  function handleBackClick() {
    onBack?.();
    goBack();
  }

  function handleHomeClick() {
    onHome?.();
    goHome();
  }

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        aria-label={t(m.navBack)}
        disabled={!canGoBack}
        size="large"
        color="inherit"
        variant="contained"
        onClick={handleBackClick}
        sx={{ width: 72 }}
      >
        <ArrowBackOutlinedIcon sx={flipForRtl} />
      </Button>

      <Button
        aria-label={t(m.navHome)}
        disabled={!canGoHome || (isHome && !onHome)}
        size="large"
        color="inherit"
        variant="contained"
        onClick={handleHomeClick}
        sx={{ width: 72 }}
      >
        <HomeOutlinedIcon />
      </Button>
    </Box>
  );
}
