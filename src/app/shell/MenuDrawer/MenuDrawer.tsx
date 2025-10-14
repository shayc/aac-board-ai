import { useSnackbar } from "@/shared/contexts/SnackbarProvider/useSnackbar";
import { openFile } from "@/shared/utils/files";
import { importFile } from "@features/board/db/import-board";
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
import { Link as RouterLink } from "react-router";

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MenuDrawer({ open, onClose }: MenuDrawerProps) {
  const { showSnackbar } = useSnackbar();

  async function handleImportBoard() {
    onClose();
    const file = await openFile();

    if (!file) {
      return;
    }

    showSnackbar({ message: "Importing board...", severity: "info" });

    try {
      await importFile(file);
      showSnackbar({
        message: "Board imported successfully",
        severity: "success",
      });
    } catch (error) {
      showSnackbar({ message: "Failed to import board", severity: "error" });
    }
  }

  const menuItems = [
    {
      icon: FileOpenIcon,
      label: "Import board...",
      onClick: handleImportBoard,
    },
    { icon: InfoOutlinedIcon, label: "About", to: "/about" },
    {
      icon: GitHubIcon,
      label: "Contribute",
      href: "http://github.com/shayc/aac-board-ai",
    },
  ];
  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 360 }}>
        <Toolbar>
          <Typography variant="h6" component="div" noWrap>
            AAC Board AI
          </Typography>
        </Toolbar>

        <Divider />

        <List>
          {menuItems.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                onClick={item.onClick}
                component={item.to ? RouterLink : item.href ? "a" : "button"}
                to={item.to}
                href={item.href}
                target={item.href ? "_blank" : undefined}
                rel={item.href ? "noopener" : undefined}
              >
                <ListItemIcon>
                  <item.icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
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
