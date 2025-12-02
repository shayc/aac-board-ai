import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";

export interface AppHeaderProps {
  onMenuClick: () => void;
  onSettingsClick: () => void;
  children?: React.ReactNode;
}

export function AppHeader({
  onMenuClick,
  onSettingsClick,
  children,
}: AppHeaderProps) {
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

        {children}

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
