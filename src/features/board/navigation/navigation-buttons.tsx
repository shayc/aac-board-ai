import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRtl } from "@shared/theme/rtl";

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
    <ButtonGroup size="large" color="inherit">
      <Button
        aria-label={t(m.navBack)}
        disabled={!canGoBack}
        onClick={onBack}
        sx={{ width: 72 }}
      >
        <ArrowBackOutlinedIcon sx={flipForRtl} />
      </Button>

      <Button
        aria-label={t(m.navHome)}
        disabled={!canGoHome}
        onClick={onHome}
        sx={{ width: 72 }}
      >
        <HomeOutlinedIcon />
      </Button>
    </ButtonGroup>
  );
}
