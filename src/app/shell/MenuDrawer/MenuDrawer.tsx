import { importFile } from "@features/board/db/import-board";
import { openFile } from "@/shared/utils/files";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import GitHubIcon from "@mui/icons-material/GitHub";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
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

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MenuDrawer({ open, onClose }: MenuDrawerProps) {
  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 360 }}>
        <Toolbar />

        <Divider />

        <List>
          <ListItem key={"Import board"} disablePadding>
            <ListItemButton
              onClick={async () => {
                try {
                  const file = await openFile();
                  if (!file) return;
                  const result = await importFile(file);
                  console.log("Imported board:", result);
                  onClose();
                } catch (error) {
                  console.error("Import failed:", error);
                }
              }}
            >
              <ListItemIcon>
                <FileOpenIcon />
              </ListItemIcon>
              <ListItemText primary={"Import board..."} />
            </ListItemButton>
          </ListItem>

          <ListItem key={"About"} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                <InfoOutlinedIcon />
              </ListItemIcon>
              <ListItemText primary={"About"} />
            </ListItemButton>
          </ListItem>

          <ListItem key={"Contribute"} disablePadding>
            <ListItemButton
              href="https://github.com/shayc/aac-board-ai"
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
