import { APP_NAME } from "@app/app-info";
import { ABOUT_PATH, LIBRARY_PATH } from "@app/routing/route-patterns";
import CloseIcon from "@mui/icons-material/Close";
import FilterNoneOutlinedIcon from "@mui/icons-material/FilterNoneOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { Link as RouterLink } from "react-router";

export const MENU_DRAWER_WIDTH = "calc(320px + env(safe-area-inset-left))";

export interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
  variant?: "temporary" | "persistent";
}

export function MenuDrawer({
  open,
  onClose,
  variant = "temporary",
}: MenuDrawerProps) {
  const closeOnNavigate = variant === "temporary" ? onClose : undefined;

  const menuItems = [
    { icon: HomeOutlinedIcon, label: m.menuHome(), to: "/" },
    { icon: FilterNoneOutlinedIcon, label: m.menuLibrary(), to: LIBRARY_PATH },
    { icon: InfoOutlinedIcon, label: m.menuAbout(), to: ABOUT_PATH },
  ];

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant={variant}
      slotProps={{
        paper: {
          "aria-label": m.menuLabel(),
          sx: { width: MENU_DRAWER_WIDTH },
        },
      }}
    >
      <Toolbar
        sx={(theme) => ({
          [theme.breakpoints.up("sm")]: {
            pl: `calc(${theme.spacing(2)} + env(safe-area-inset-left))`,
          },
        })}
      >
        <Typography component="div" variant="h6" noWrap sx={{ flexGrow: 1 }}>
          {APP_NAME}
        </Typography>

        <Tooltip title={m.menuClose()}>
          <IconButton aria-label={m.menuClose()} edge="end" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Divider />

      <List
        sx={(theme) => ({
          [theme.breakpoints.up("sm")]: {
            pl: "env(safe-area-inset-left)",
          },
        })}
      >
        {menuItems.map((item) => (
          <ListItem key={item.to} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.to}
              onClick={closeOnNavigate}
            >
              <ListItemIcon>
                <item.icon />
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
