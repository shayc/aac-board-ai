import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

interface NavButtonsProps {
  canGoBack: boolean;
  canGoHome: boolean;
  navigateBack: () => void;
  navigateHome: () => void;
}

export function NavButtons({
  canGoBack,
  canGoHome,
  navigateBack,
  navigateHome,
}: NavButtonsProps) {
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Tooltip title="Go back">
        <span>
          <IconButton
            aria-label="Back"
            size="large"
            disabled={!canGoBack}
            onClick={() => navigateBack()}
          >
            <ArrowBackOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Go home">
        <span>
          <IconButton
            aria-label="Home"
            size="large"
            disabled={!canGoHome}
            onClick={() => navigateHome()}
          >
            <HomeOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
