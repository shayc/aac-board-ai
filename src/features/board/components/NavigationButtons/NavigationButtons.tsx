import { useBoard } from "@features/board/context/useBoard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

export function NavigationButtons() {
  const { canGoBack, canGoHome, navigateBack, navigateHome } = useBoard();

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
            <ArrowBackIcon />
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
            <HomeIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
