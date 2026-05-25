import { APP_NAME } from "@app/app-info";
import FilterNoneOutlinedIcon from "@mui/icons-material/FilterNoneOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { Link as RouterLink } from "react-router";

export interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MenuDrawer({ open, onClose }: MenuDrawerProps) {
  const menuItems = [
    { icon: HomeOutlinedIcon, label: m.menuHome(), to: "/" },
    { icon: FilterNoneOutlinedIcon, label: m.menuLibrary(), to: "/library" },
    { icon: InfoOutlinedIcon, label: m.menuAbout(), to: "/about" },
  ];

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { width: "calc(320px + env(safe-area-inset-left))" },
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
        <Typography component="div" variant="h6" noWrap>
          {APP_NAME}
        </Typography>
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
              onClick={onClose}
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
