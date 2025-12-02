import { useBoard } from "@features/board/context/useBoard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

export function BoardNavigation() {
  const { canGoBack, canGoHome, navigateBack, navigateHome } = useBoard();

  return (
    <>
      <Tooltip title="Go back" enterDelay={800}>
        <span>
          <IconButton
            aria-label="Back"
            size="large"
            color="inherit"
            disabled={!canGoBack}
            onClick={() => navigateBack()}
          >
            <ArrowBackIcon />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Go home" enterDelay={800}>
        <span>
          <IconButton
            aria-label="Home"
            size="large"
            color="inherit"
            disabled={!canGoHome}
            onClick={() => navigateHome()}
            sx={{ mr: 2 }}
          >
            <HomeIcon />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
}
