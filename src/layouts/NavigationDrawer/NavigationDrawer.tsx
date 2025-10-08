import FileOpenIcon from "@mui/icons-material/FileOpen";
import GitHubIcon from "@mui/icons-material/GitHub";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function NavigationDrawer({ open, onClose }: NavigationDrawerProps) {
  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 360 }}>
        <Toolbar />

        <Divider />

        <List>
          <ListItem key={"Open file"} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <FileOpenIcon />
              </ListItemIcon>
              <ListItemText primary={"Open file"} />
            </ListItemButton>
          </ListItem>
          <ListItem key={"Contribute"} disablePadding>
            <ListItemButton
              href="https://github.com/shayc/ai-communication-board"
              target="_blank"
              rel="noopener"
            >
              <ListItemIcon>
                <GitHubIcon />
              </ListItemIcon>
              <ListItemText primary={"Contribute"} />
            </ListItemButton>
          </ListItem>
        </List>

        <Divider />
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ m: 2 }}
        >
          Powered by{" "}
          <Link
            href="https://developer.chrome.com/docs/ai/built-in"
            underline="hover"
            target="_blank"
            rel="noopener"
          >
            Built-in AI
          </Link>
        </Typography>
      </Box>
    </Drawer>
  );
}
