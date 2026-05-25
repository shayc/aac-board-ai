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
  onMenuClick: () => void;
  onSettingsClick: () => void;
}

export function AppHeader({ onMenuClick, onSettingsClick }: AppHeaderProps) {
  const pageTitle = usePageTitle();

  return (
    <AppBar
      position="static"
      sx={(theme) => ({
        [theme.breakpoints.down("md")]: {
          "@media (orientation: landscape)": {
            display: "none",
          },
        },
      })}
    >
      <Toolbar
        sx={(theme) => ({
          [theme.breakpoints.up("sm")]: {
            pl: "env(safe-area-inset-left)",
            pr: "env(safe-area-inset-right)",
          },
        })}
      >
        <Tooltip title={m.menuOpen()}>
          <IconButton
            aria-label={m.menuLabel()}
            size="large"
            edge="start"
            color="inherit"
            onClick={onMenuClick}
            sx={{ marginInlineEnd: 2 }}
          >
            <MenuIcon />
          </IconButton>
        </Tooltip>

        <Typography component="h1" variant="h6" noWrap sx={{ flexGrow: 1 }}>
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
