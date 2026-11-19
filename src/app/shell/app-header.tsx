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
import type { Theme } from "@mui/material/styles";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForLTR } from "@shared/theme/rtl";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { shortLandscape } from "@shared/theme/short-landscape";
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
          // Aligns the outer icons with the board's page margin below.
          ...toolbarGutters(theme, 3),
          [theme.breakpoints.down("sm")]: toolbarGutters(theme, 2),
          [shortLandscape(theme)]: toolbarGutters(theme, 2),
        })}
      >
        <Tooltip title={t(m.libraryOpen)}>
          <IconButton
            aria-label={t(m.libraryOpen)}
            size="large"
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

function toolbarGutters(theme: Theme, units: number) {
  return {
    pl: safeAreaGutter(theme.spacing(units), "left"),
    pr: safeAreaGutter(theme.spacing(units), "right"),
  };
}
