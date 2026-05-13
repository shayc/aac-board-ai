import CollectionsBookmarkOutlinedIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
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
import { Link as RouterLink } from "react-router";

const menuItems = [
  { icon: HomeOutlinedIcon, label: "Home", to: "/" },
  { icon: CollectionsBookmarkOutlinedIcon, label: "Library", to: "/library" },
  { icon: InfoOutlinedIcon, label: "About", to: "/about" },
];

export interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MenuDrawer({ open, onClose }: MenuDrawerProps) {
  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 320 }}>
        <Toolbar>
          <Typography variant="h6" component="div" noWrap>
            AAC Board AI
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
