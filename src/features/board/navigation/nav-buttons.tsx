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

export interface NavButtonsProps {
  slotProps?: NavButtonsSlotProps;
}

export function NavButtons({ slotProps }: NavButtonsProps = {}) {
  const { setId, canGoBack, canGoHome, isHome, goBack, goHome } =
    useBoardNavigation();
  const { sx: backButtonSx, ...backButtonProps } = slotProps?.backButton ?? {};
  const { sx: homeButtonSx, ...homeButtonProps } = slotProps?.homeButton ?? {};

  if (!setId) {
    return null;
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
        sx={mergeSx({ width: 96 }, backButtonSx)}
        onClick={goBack}
      >
        <ArrowBackOutlinedIcon sx={flipForRtl} />
      </Button>

      <Button
        {...homeButtonProps}
        aria-label={m.navHome()}
        size="large"
        color="inherit"
        disabled={!canGoHome || isHome}
        variant="contained"
        sx={mergeSx({ width: 96 }, homeButtonSx)}
        onClick={goHome}
      >
        <HomeOutlinedIcon />
      </Button>
    </Box>
  );
}
