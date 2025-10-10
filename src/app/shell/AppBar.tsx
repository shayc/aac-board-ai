import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import MUIAppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { NavigationBar } from "./NavigationBar/NavigationBar";

interface AppBarProps {
  onMenuClick: () => void;
  onSettingsClick: () => void;
}

export function AppBar({ onMenuClick, onSettingsClick }: AppBarProps) {
  return (
    <MUIAppBar position="static">
      <Toolbar>
        <Tooltip title="Open menu" enterDelay={800}>
          <span>
            <IconButton
              aria-label="Menu"
              size="large"
              edge="start"
              color="inherit"
              onClick={onMenuClick}
            >
              <MenuIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
          <NavigationBar />
        </Box>

        <Tooltip title="Open settings" enterDelay={800}>
          <span>
            <IconButton
              aria-label="Settings"
              size="large"
              edge="end"
              color="inherit"
              onClick={onSettingsClick}
            >
              <SettingsIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Toolbar>
    </MUIAppBar>
  );
}
