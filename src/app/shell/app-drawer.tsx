import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { type ReactNode, useState } from "react";

const DRAWER_BASE_WIDTH = "320px";

interface AppDrawerProps {
  title: string;
  closeLabel: string;
  open: boolean;
  onClose: () => void;
  anchor: "left" | "right";
  children: ReactNode;
}

export function AppDrawer({
  title,
  closeLabel,
  open,
  onClose,
  anchor,
  children,
}: AppDrawerProps) {
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
      <AppDrawerContent title={title} closeLabel={closeLabel} onClose={onClose}>
        {children}
      </AppDrawerContent>
    </Drawer>
  );
}

interface AppDrawerContentProps {
  title: string;
  closeLabel: string;
  children: ReactNode;
  onClose: () => void;
}

function AppDrawerContent({
  title,
  closeLabel,
  children,
  onClose,
}: AppDrawerContentProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <>
      <Toolbar
        component="header"
        sx={{
          borderBottom: 1,
          borderColor: isScrolled ? "divider" : "transparent",
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
        onScroll={(event) => setIsScrolled(event.currentTarget.scrollTop > 0)}
        sx={{ flexGrow: 1, minHeight: 0, overflow: "auto" }}
      >
        {children}
      </Box>
    </>
  );
}
