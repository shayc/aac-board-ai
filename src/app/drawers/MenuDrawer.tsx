import { importBoardFiles } from "@features/board/store/board-sets-store";
import FileOpenOutlined from "@mui/icons-material/FileOpenOutlined";
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
import { useSnackbar } from "@shared/contexts/SnackbarProvider/useSnackbar";
import { openFiles } from "@shared/utils/files";
import { Link as RouterLink, useNavigate } from "react-router";

export interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MenuDrawer({ open, onClose }: MenuDrawerProps) {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  async function handleImportBoard() {
    const files = await openFiles();

    if (files.length === 0) {
      return;
    }

    onClose();

    const isPlural = files.length > 1;
    showSnackbar({
      message: isPlural ? "Importing boards..." : "Importing board...",
    });

    try {
      const results = await importBoardFiles(files);

      showSnackbar({
        message: isPlural
          ? "Boards imported successfully"
          : "Board imported successfully",
        severity: "success",
      });

      if (results.length === 1) {
        const { setId, boardId } = results[0];
        void navigate(
          `/sets/${encodeURIComponent(setId)}/boards/${encodeURIComponent(boardId)}`,
        );
      }
    } catch {
      showSnackbar({
        message: isPlural
          ? "Failed to import boards"
          : "Failed to import board",
        severity: "error",
      });
    }
  }

  const menuItems = [
    {
      id: "import-board",
      icon: FileOpenOutlined,
      label: "Import board...",
      onClick: handleImportBoard,
    },
    {
      id: "about",
      icon: InfoOutlinedIcon,
      label: "About",
      to: "/about",
      onClick: onClose,
    },
    {
      id: "contribute",
      icon: GitHubIcon,
      label: "Contribute",
      href: "https://github.com/shayc/aac-board-ai",
    },
  ];

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
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={item.onClick ? () => void item.onClick?.() : undefined}
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
