import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForRTL } from "@shared/theme/rtl";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";

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
      <Button
        {...focusableDisabledProps(!canGoBack, onBack)}
        aria-label={t(m.navBack)}
        size="large"
        color="inherit"
        variant="contained"
        sx={{ width: 72 }}
      >
        <ArrowBackOutlinedIcon sx={flipForRTL} />
      </Button>

      <Button
        {...focusableDisabledProps(!canGoHome, onHome)}
        aria-label={t(m.navHome)}
        size="large"
        color="inherit"
        variant="contained"
        sx={{ width: 72 }}
      >
        <HomeOutlinedIcon />
      </Button>
    </Box>
  );
}
