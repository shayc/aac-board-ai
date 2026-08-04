import { BoardSelector } from "@features/board";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForLtr } from "@shared/theme/rtl";
import { safeAreaGutter } from "@shared/theme/safe-area";

interface AppHeaderProps {
  libraryButtonHidden?: boolean;
  onLibraryClick: () => void;
  onSettingsClick: () => void;
}

export function AppHeader({
  libraryButtonHidden = false,
  onLibraryClick,
  onSettingsClick,
}: AppHeaderProps) {
  const t = useTranslate();

  return (
    <AppBar position="static">
      <Toolbar
        sx={(theme) => ({
          display: "grid",
          gridTemplateColumns: "1fr minmax(0, auto) 1fr",
          alignItems: "center",
          gap: theme.spacing(2),
          pl: safeAreaGutter(theme.spacing(3), "left"),
          pr: safeAreaGutter(theme.spacing(3), "right"),
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
            <Tooltip title={t(m.libraryOpen)}>
              <IconButton
                aria-label={t(m.libraryOpen)}
                size="large"
                edge="start"
                color="inherit"
                onClick={onLibraryClick}
              >
                <ViewSidebarOutlinedIcon sx={flipForLtr} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <BoardSelector />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifySelf: "end" }}>
          <Tooltip title={t(m.settingsOpen)}>
            <IconButton
              aria-label={t(m.settingsOpen)}
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
