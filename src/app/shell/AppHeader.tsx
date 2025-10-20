import { useBoard } from "@/features/board/context/useBoard";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { BoardSetSelector } from "./BoardSetSelector/BoardSetSelector";

interface AppHeaderProps {
  onMenuClick: () => void;
  onSettingsClick: () => void;
}

export function AppHeader({ onMenuClick, onSettingsClick }: AppHeaderProps) {
  const { canGoBack, canGoHome, navigateBack, navigateHome } = useBoard();

  return (
    <AppBar position="static">
      <Toolbar>
        <Tooltip title="Open menu" enterDelay={800}>
          <IconButton
            aria-label="Menu"
            size="large"
            edge="start"
            color="inherit"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>

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
              disabled={!canGoHome}
              aria-label="Home"
              size="large"
              color="inherit"
              onClick={() => navigateHome()}
              sx={{ mr: 2 }}
            >
              <HomeIcon />
            </IconButton>
          </span>
        </Tooltip>

        <BoardSetSelector />

        <Tooltip title="Open settings" enterDelay={800} sx={{ ml: "auto" }}>
          <IconButton
            aria-label="Settings"
            size="large"
            edge="end"
            color="inherit"
            onClick={onSettingsClick}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
