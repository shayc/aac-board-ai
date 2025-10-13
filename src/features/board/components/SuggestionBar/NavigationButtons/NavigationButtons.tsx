import { useBoard } from "@features/board/context/useBoard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

export function NavigationBar() {
  const { navigation } = useBoard();

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Tooltip title="Go back" enterDelay={800}>
        <span>
          <IconButton
            aria-label="Back"
            size="large"
            color="inherit"
            disabled={!navigation.canGoBack}
            onClick={() => navigation.goBack()}
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
            onClick={() => navigation.goHome()}
            sx={{ mr: 2 }}
          >
            <HomeIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
