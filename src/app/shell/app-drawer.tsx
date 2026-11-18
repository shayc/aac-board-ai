import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEndSide, useStartSide } from "@shared/theme/rtl";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { ErrorBoundary } from "@shared/ui/error-boundary";
import { ErrorState } from "@shared/ui/error-state";
import { type ReactNode, useState } from "react";

const DRAWER_BASE_WIDTH = "320px";

interface AppDrawerProps {
  title: string;
  closeLabel: string;
  errorTitle: string;
  open: boolean;
  onClose: () => void;
  anchor: "left" | "right";
  hasInvisibleBackdrop?: boolean;
  children: ReactNode;
}

export function AppDrawer({
  title,
  closeLabel,
  errorTitle,
  open,
  onClose,
  anchor,
  hasInvisibleBackdrop = false,
  children,
}: AppDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor={anchor}
      slotProps={{
        backdrop: { invisible: hasInvisibleBackdrop },
        paper: {
          "aria-label": title,
          sx: [
            { width: safeAreaGutter(DRAWER_BASE_WIDTH, anchor) },
            hasInvisibleBackdrop && innerEdgeSx(anchor),
          ],
        },
      }}
    >
      <AppDrawerContent
        title={title}
        closeLabel={closeLabel}
        anchor={anchor}
        onClose={onClose}
      >
        <ErrorBoundary
          fallback={
            <Box sx={{ height: "100%", px: 2 }}>
              <ErrorState icon={null} title={errorTitle} />
            </Box>
          }
        >
          {children}
        </ErrorBoundary>
      </AppDrawerContent>
    </Drawer>
  );
}

// Without the dimming, the dark drawer is the page's own color and its shadow
// does not show, so a line marks where it ends. The RTL stylis plugin mirrors
// the side with the drawer anchor.
function innerEdgeSx(anchor: "left" | "right") {
  const innerBorder = anchor === "left" ? "borderRight" : "borderLeft";

  return { [innerBorder]: 1, borderColor: "outline" };
}

interface AppDrawerContentProps {
  title: string;
  closeLabel: string;
  anchor: "left" | "right";
  children: ReactNode;
  onClose: () => void;
}

function AppDrawerContent({
  title,
  closeLabel,
  anchor,
  children,
  onClose,
}: AppDrawerContentProps) {
  const startSide = useStartSide();
  const endSide = useEndSide();
  const [isScrolled, setIsScrolled] = useState(false);
  // MUI mirrors the drawer anchor in right-to-left, so "left" is the start
  // side; the tooltip points into the screen, away from the drawer's edge.
  const closeTooltipPlacement = anchor === "left" ? endSide : startSide;

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

        <Tooltip title={closeLabel} placement={closeTooltipPlacement}>
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
