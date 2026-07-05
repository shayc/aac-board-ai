import { BoardSwitcher, NavButtons } from "@features/board";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { flipForLtr } from "@shared/theme/rtl";
import { safeAreaGutter } from "@shared/theme/safe-area";

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
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  return (
    <AppBar position="static">
      <Toolbar
        sx={(theme) => ({
          display: "grid",
          gridTemplateColumns: "1fr minmax(0, auto) 1fr",
          alignItems: "center",
          gap: theme.spacing(2),
          pl: safeAreaGutter(theme.spacing(2), "left"),
          pr: safeAreaGutter(theme.spacing(2), "right"),
          [theme.breakpoints.up("sm")]: {
            pl: safeAreaGutter(theme.spacing(3), "left"),
            pr: safeAreaGutter(theme.spacing(3), "right"),
          },
        })}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifySelf: "start",
            gap: 2,
          }}
        >
          {!libraryButtonHidden && (
            <Tooltip title={m.libraryOpen()}>
              <IconButton
                aria-label={m.libraryOpen()}
                size="large"
                edge="start"
                color="inherit"
                onClick={onLibraryClick}
              >
                <ViewSidebarOutlinedIcon sx={flipForLtr} />
              </IconButton>
            </Tooltip>
          )}

          {!isSmallScreen && <NavButtons />}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <BoardSwitcher />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifySelf: "end" }}>
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
        </Box>
      </Toolbar>
    </AppBar>
  );
}
