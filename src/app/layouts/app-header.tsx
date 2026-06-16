import MenuIcon from "@mui/icons-material/Menu";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AppBar from "@mui/material/AppBar";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { usePageTitle } from "./page-title-store";

export interface AppHeaderProps {
  onLibraryClick: () => void;
  onSettingsClick: () => void;
  libraryButtonHidden?: boolean;
}

export function AppHeader({
  onLibraryClick,
  onSettingsClick,
  libraryButtonHidden = false,
}: AppHeaderProps) {
  const pageTitle = usePageTitle();

  return (
    <AppBar position="static">
      <Toolbar>
        {!libraryButtonHidden && (
          <Tooltip title={m.libraryOpen()}>
            <IconButton
              aria-label={m.libraryTitle()}
              size="large"
              edge="start"
              color="inherit"
              onClick={onLibraryClick}
              sx={{ marginInlineEnd: 2 }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
        )}

        <Typography noWrap component="h1" variant="h6" sx={{ flexGrow: 1 }}>
          {pageTitle}
        </Typography>

        <Tooltip title={m.settingsOpen()}>
          <IconButton
            aria-label={m.settingsTitle()}
            size="large"
            edge="end"
            color="inherit"
            onClick={onSettingsClick}
          >
            <SettingsOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
