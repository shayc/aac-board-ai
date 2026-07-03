import { BoardSwitcher, NavButtons } from "@features/board";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { flipForLtr } from "@shared/theme/rtl";
import { usePageTitle } from "./page-title-store";

export interface AppHeaderProps {
  libraryButtonHidden?: boolean;
  onLibraryClick: () => void;
  onSettingsClick: () => void;
}

export function AppHeader({
  libraryButtonHidden = false,
  onLibraryClick,
  onSettingsClick,
}: AppHeaderProps) {
  const pageTitle = usePageTitle();

  return (
    <AppBar position="static">
      <Toolbar>
        {!libraryButtonHidden && (
          <Tooltip title={m.libraryOpen()}>
            <IconButton
              aria-label={m.libraryOpen()}
              size="large"
              edge="start"
              color="inherit"
              onClick={onLibraryClick}
              sx={{ marginInlineEnd: 1 }}
            >
              <ViewSidebarOutlinedIcon sx={flipForLtr} />
            </IconButton>
          </Tooltip>
        )}

        <NavButtons />

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <BoardSwitcher label={pageTitle} />
        </Box>

        <Tooltip title={m.settingsOpen()}>
          <IconButton
            aria-label={m.settingsOpen()}
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
