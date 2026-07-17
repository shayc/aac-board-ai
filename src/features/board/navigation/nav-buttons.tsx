import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { m } from "@paraglide/messages.js";
import { flipForRtl } from "@shared/theme/rtl";
import { useBoardNavigation } from "./use-board-navigation";

export function NavButtons() {
  const { setId, canGoBack, canGoHome, goBack, goHome } = useBoardNavigation();

  if (!setId) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        aria-label={m.navBack()}
        size="large"
        color="inherit"
        disabled={!canGoBack}
        variant="contained"
        sx={{ width: 72 }}
        onClick={goBack}
      >
        <ArrowBackOutlinedIcon sx={flipForRtl} />
      </Button>

      <Button
        aria-label={m.navHome()}
        size="large"
        color="inherit"
        disabled={!canGoHome}
        variant="contained"
        sx={{ width: 72 }}
        onClick={goHome}
      >
        <HomeOutlinedIcon />
      </Button>
    </Box>
  );
}
