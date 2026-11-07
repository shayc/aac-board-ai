import { DRAWER_BASE_WIDTH } from "@app/shell/drawer-width";
import { BoardSetLibrary } from "@features/board";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { safeAreaGutter } from "@shared/theme/safe-area";
import { useMatches } from "react-router";

interface LibraryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function LibraryDrawer({ open, onClose }: LibraryDrawerProps) {
  const t = useTranslate();

  const activeMatch = useMatches().find((match) => match.params.boardSetId);
  const activeBoardSetId = activeMatch?.params.boardSetId;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="left"
      slotProps={{
        paper: {
          "aria-label": t(m.libraryTitle),
          sx: {
            display: "flex",
            flexDirection: "column",
            width: safeAreaGutter(DRAWER_BASE_WIDTH, "left"),
          },
        },
      }}
    >
      <Toolbar>
        <Typography component="h2" variant="h6" sx={{ flexGrow: 1 }}>
          {t(m.libraryTitle)}
        </Typography>

        <Tooltip title={t(m.libraryClose)}>
          <IconButton
            aria-label={t(m.libraryClose)}
            size="large"
            edge="end"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>

      <Box sx={{ flexGrow: 1, minHeight: 0, overflow: "auto" }}>
        <BoardSetLibrary
          activeBoardSetId={activeBoardSetId}
          onNavigate={onClose}
        />
      </Box>
    </Drawer>
  );
}
