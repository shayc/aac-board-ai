import { LIBRARY_DRAWER_WIDTH } from "@app/layouts/drawer-width";
import { BoardSetLibrary, boardSetPath } from "@features/board";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { flipForLtr } from "@shared/theme/rtl";
import { safeAreaGutter, safeAreaInset } from "@shared/theme/safe-area";
import { useMatches, useNavigate } from "react-router";

interface LibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  variant?: "temporary" | "persistent";
}

export function LibraryDrawer({
  open,
  onClose,
  variant = "temporary",
}: LibraryDrawerProps) {
  const t = useTranslate();

  const navigate = useNavigate();
  const activeMatch = useMatches().find((match) => match.params.setId);
  const activeSetId = activeMatch?.params.setId;

  const closeOnNavigate = variant === "temporary" ? onClose : undefined;

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant={variant}
      slotProps={{
        paper: {
          "aria-label": t(m.libraryTitle),
          ...(variant === "persistent" && { component: "aside" }),
          sx: {
            width: LIBRARY_DRAWER_WIDTH,
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <Toolbar
        sx={(theme) => ({
          [theme.breakpoints.up("sm")]: {
            pl: safeAreaGutter(theme.spacing(2), "left"),
          },
        })}
      >
        <Typography component="h2" variant="h6" sx={{ flexGrow: 1 }}>
          {t(m.libraryTitle)}
        </Typography>

        <Tooltip title={t(m.libraryClose)}>
          <IconButton
            aria-label={t(m.libraryClose)}
            size="large"
            edge="end"
            color="inherit"
            onClick={onClose}
          >
            <ViewSidebarOutlinedIcon sx={flipForLtr} />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Box
        sx={(theme) => ({
          flexGrow: 1,
          minHeight: 0,
          overflow: "auto",
          [theme.breakpoints.up("sm")]: {
            pl: safeAreaInset("left"),
          },
        })}
      >
        <BoardSetLibrary
          selectedSetId={activeSetId}
          onSelect={(boardSet) => {
            void navigate(boardSetPath(boardSet));
            closeOnNavigate?.();
          }}
        />
      </Box>
    </Drawer>
  );
}
