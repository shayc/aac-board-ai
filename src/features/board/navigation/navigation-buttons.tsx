import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { scanGroupProps } from "../scanning/scan-targets";

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
    <Box {...scanGroupProps} sx={{ display: "flex", gap: 1 }}>
      <Button
        aria-label={t(m.navBack)}
        disabled={!canGoBack}
        size="large"
        color="inherit"
        variant="contained"
        onClick={onBack}
        sx={{ width: 72 }}
      >
        <ArrowBackOutlinedIcon sx={flipForRTL} />
      </Button>

      <Button
        aria-label={t(m.navHome)}
        disabled={!canGoHome}
        size="large"
        color="inherit"
        variant="contained"
        onClick={onHome}
        sx={{ width: 72 }}
      >
        <HomeOutlinedIcon />
      </Button>
    </Box>
  );
}
