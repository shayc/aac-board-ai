import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { flipForRtl } from "@shared/theme/rtl";
import { useBoardNavigation } from "./use-board-navigation";

export function NavButtons() {
  const { setId, canGoBack, canGoHome, goBack, goHome } = useBoardNavigation();

  if (!setId) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", gap: 1, marginInlineEnd: 1 }}>
      <Tooltip title={m.navBack()}>
        <span>
          <IconButton
            aria-label={m.navBack()}
            size="large"
            color="inherit"
            disabled={!canGoBack}
            onClick={goBack}
          >
            <ArrowBackOutlinedIcon sx={flipForRtl} />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title={m.navHome()}>
        <span>
          <IconButton
            aria-label={m.navHome()}
            size="large"
            color="inherit"
            disabled={!canGoHome}
            onClick={goHome}
          >
            <HomeOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
