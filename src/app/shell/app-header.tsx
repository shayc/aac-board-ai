import {
  BOARD_SET_ROUTE_ID,
  type boardSetLoader,
} from "@app/routing/board-set/board-set-loader";
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
import { flipForLTR } from "@shared/theme/rtl";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { useRouteLoaderData } from "react-router";

interface AppHeaderProps {
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
}

export function AppHeader({ onOpenLibrary, onOpenSettings }: AppHeaderProps) {
  const t = useTranslate();
  const boards =
    useRouteLoaderData<typeof boardSetLoader>(BOARD_SET_ROUTE_ID)?.boards;

  return (
    <AppBar position="static">
      <Toolbar
        disableGutters
        sx={(theme) => ({
          display: "grid",
          gridTemplateColumns: "1fr minmax(0, auto) 1fr",
          alignItems: "center",
          gap: theme.spacing(2),
          pl: safeAreaGutter(theme.spacing(3), "left"),
          pr: safeAreaGutter(theme.spacing(3), "right"),
        })}
      >
        <Tooltip title={t(m.libraryOpen)}>
          <IconButton
            aria-label={t(m.libraryOpen)}
            size="large"
            edge="start"
            onClick={onOpenLibrary}
            sx={{ justifySelf: "start" }}
          >
            <ViewSidebarOutlinedIcon sx={flipForLTR} />
          </IconButton>
        </Tooltip>

        <Box sx={{ minWidth: 0 }}>
          {boards && <BoardSelector boards={boards} />}
        </Box>

        <Tooltip title={t(m.settingsOpen)}>
          <IconButton
            aria-label={t(m.settingsOpen)}
            size="large"
            edge="end"
            onClick={onOpenSettings}
            sx={{ justifySelf: "end" }}
          >
            <SettingsOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
