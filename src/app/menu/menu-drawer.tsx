import { APP_NAME } from "@app/app-info";
import FilterNoneOutlinedIcon from "@mui/icons-material/FilterNoneOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
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
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 320 }}>
        <Toolbar>
          <Typography variant="h6" component="div" noWrap>
            {APP_NAME}
          </Typography>
        </Toolbar>

        <Divider />

        <List>
          {menuItems.map((item) => (
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                onClick={onClose}
                component={RouterLink}
                to={item.to}
              >
                <ListItemIcon>
                  <item.icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
