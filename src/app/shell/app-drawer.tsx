import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { useState, type ReactNode } from "react";

const DRAWER_BASE_WIDTH = "320px";

interface AppDrawerProps {
  title: string;
  closeLabel: string;
  open: boolean;
  anchor: "left" | "right";
  children: ReactNode;
  onClose: () => void;
}

export function AppDrawer({
  title,
  closeLabel,
  open,
  anchor,
  children,
  onClose,
}: AppDrawerProps) {
  const [isContentScrolled, setIsContentScrolled] = useState(false);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor={anchor}
      slotProps={{
        paper: {
          "aria-label": title,
          sx: {
            display: "flex",
            flexDirection: "column",
            width: safeAreaGutter(DRAWER_BASE_WIDTH, anchor),
          },
        },
      }}
    >
      <Toolbar
        component="header"
        sx={{
          borderBottom: 1,
          borderColor: isContentScrolled ? "divider" : "transparent",
        }}
      >
        <Typography component="h2" variant="h6" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        <Tooltip title={closeLabel}>
          <IconButton
            aria-label={closeLabel}
            size="large"
            edge="end"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Box
        onScroll={(event) =>
          setIsContentScrolled(event.currentTarget.scrollTop > 0)
        }
        sx={{ flexGrow: 1, minHeight: 0, overflow: "auto" }}
      >
        {children}
      </Box>
    </Drawer>
  );
}
