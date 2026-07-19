import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
import Button, { type ButtonProps } from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { mergeSx } from "@shared/theme/merge-sx";
import { flipForRtl } from "@shared/theme/rtl";
import { useBoardNavigation } from "./use-board-navigation";

type NavigationButtonSlotProps = Omit<
  ButtonProps,
  | "aria-label"
  | "children"
  | "color"
  | "disabled"
  | "onClick"
  | "size"
  | "variant"
>;

export interface NavButtonsSlotProps {
  backButton?: NavigationButtonSlotProps;
  homeButton?: NavigationButtonSlotProps;
}

interface NavButtonsProps {
  slotProps?: NavButtonsSlotProps;
  onBackClick?: () => void;
  onHomeClick?: () => void;
}

export function NavButtons({
  slotProps,
  onBackClick,
  onHomeClick,
}: NavButtonsProps = {}) {
  const { setId, canGoBack, canGoHome, isHome, goBack, goHome } =
    useBoardNavigation();
  const { sx: backButtonSx, ...backButtonProps } = slotProps?.backButton ?? {};
  const { sx: homeButtonSx, ...homeButtonProps } = slotProps?.homeButton ?? {};

  if (!setId) {
    return null;
  }

  function handleBackClick() {
    onBackClick?.();
    goBack();
  }

  function handleHomeClick() {
    onHomeClick?.();
    goHome();
  }

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        {...backButtonProps}
        aria-label={m.navBack()}
        size="large"
        color="inherit"
        disabled={!canGoBack}
        variant="contained"
        sx={mergeSx({ width: 72 }, backButtonSx)}
        onClick={handleBackClick}
      >
        <ArrowBackOutlinedIcon sx={flipForRtl} />
      </Button>

      <Button
        {...homeButtonProps}
        aria-label={m.navHome()}
        size="large"
        color="inherit"
        disabled={!canGoHome || (isHome && !onHomeClick)}
        variant="contained"
        sx={mergeSx({ width: 72 }, homeButtonSx)}
        onClick={handleHomeClick}
      >
        <HomeOutlinedIcon />
      </Button>
    </Box>
  );
}
