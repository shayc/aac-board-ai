import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { flipForRtl } from "@shared/theme/rtl";

export interface NavButtonsProps {
  canGoBack: boolean;
  canGoHome: boolean;
  onBackClick: () => void;
  onHomeClick: () => void;
}

export function NavButtons({
  canGoBack,
  canGoHome,
  onBackClick,
  onHomeClick,
}: NavButtonsProps) {
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Tooltip title={m.navBack()}>
        <span>
          <IconButton
            aria-label={m.navBack()}
            size="large"
            disabled={!canGoBack}
            onClick={onBackClick}
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
            disabled={!canGoHome}
            onClick={onHomeClick}
          >
            <HomeOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
