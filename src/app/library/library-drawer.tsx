import { DRAWER_BASE_WIDTH } from "@app/layouts/drawer-width";
import { BoardSetLibrary, boardSetPath } from "@features/board";
import GitHubIcon from "@mui/icons-material/GitHub";
import ViewSidebarOutlinedIcon from "@mui/icons-material/ViewSidebarOutlined";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { ExternalLink } from "@shared/components/external-link";
import { flipForLtr } from "@shared/theme/rtl";
import { useMatches, useNavigate } from "react-router";

export const LIBRARY_DRAWER_WIDTH = `calc(${DRAWER_BASE_WIDTH} + env(safe-area-inset-left))`;

export interface LibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  variant?: "temporary" | "persistent";
}

export function LibraryDrawer({
  open,
  onClose,
  variant = "temporary",
}: LibraryDrawerProps) {
  const navigate = useNavigate();
  const activeMatch = useMatches().find((match) => match.params.setId);
  const activeSetId = activeMatch?.params.setId;

  const closeOnNavigate = variant === "temporary" ? onClose : undefined;
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const animated = variant === "temporary" && !reducedMotion;

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant={variant}
      transitionDuration={animated ? undefined : 0}
      slotProps={{
        paper: {
          "aria-label": m.libraryTitle(),
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
            pl: `calc(${theme.spacing(2)} + env(safe-area-inset-left))`,
          },
        })}
      >
        <Typography component="h2" variant="h6" sx={{ flexGrow: 1 }}>
          {m.libraryTitle()}
        </Typography>

        <Tooltip title={m.libraryClose()}>
          <IconButton
            aria-label={m.libraryClose()}
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
            pl: "env(safe-area-inset-left)",
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

      <Box
        component="footer"
        sx={(theme) => ({
          p: 2,
          textAlign: "center",
          [theme.breakpoints.up("sm")]: {
            pl: `calc(${theme.spacing(2)} + env(safe-area-inset-left))`,
          },
        })}
      >
        <ExternalLink
          href="https://github.com/shayc/aac-board-ai"
          color="text.secondary"
        >
          <GitHubIcon
            fontSize="small"
            sx={{ verticalAlign: "text-bottom", mr: 1 }}
          />
          {m.librarySourceCode()}
        </ExternalLink>
      </Box>
    </Drawer>
  );
}
