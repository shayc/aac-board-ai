import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { m } from "@paraglide/messages.js";
import { useTranslate, type Translate } from "@shared/language/use-translate";
import type { BoardSetRecord } from "../storage/board-set-storage";

interface BoardSetInfoDialogProps {
  boardSet: BoardSetRecord | null;
  onClose: () => void;
}

export function BoardSetInfoDialog({
  boardSet,
  onClose,
}: BoardSetInfoDialogProps) {
  const t = useTranslate();
  const isSmallScreen = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const chipLabels = boardSet ? buildChipLabels(t, boardSet) : [];

  return (
    <Dialog
      open={boardSet !== null}
      onClose={onClose}
      fullScreen={isSmallScreen}
      fullWidth
      maxWidth="sm"
    >
      <Box sx={{ px: 3, py: 2 }}>
        <DialogTitle sx={{ p: 0 }}>{boardSet?.name}</DialogTitle>

        {boardSet?.author && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t(m.libraryByAuthor, { author: boardSet.author })}
          </Typography>
        )}
      </Box>

      <DialogContent
        // A long description scrolls, and nothing inside it takes focus, so
        // the scroller itself is the keyboard's way to read past the fold.
        role="region"
        aria-label={t(m.libraryInfo)}
        tabIndex={0}
        sx={{
          pt: 0,
          overflowX: "hidden",
          overflowY: "auto",
          // Descriptions carry URLs and credits people need to copy; the app
          // turns selection off globally for the board.
          userSelect: "text",
          "&:focus-visible": { outlineOffset: -2 },
        }}
      >
        {chipLabels.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            {chipLabels.map((label) => (
              <Chip key={label} label={label} size="small" variant="outlined" />
            ))}
          </Stack>
        )}

        {boardSet?.description && (
          <Typography variant="body1" sx={{ mt: 2, whiteSpace: "pre-line" }}>
            {boardSet.description}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t(m.close)}</Button>
      </DialogActions>
    </Dialog>
  );
}

function buildChipLabels(t: Translate, boardSet: BoardSetRecord): string[] {
  const labels: string[] = [];

  if (boardSet.gridRows && boardSet.gridColumns) {
    labels.push(
      t(m.libraryGridDimensions, {
        rows: boardSet.gridRows,
        columns: boardSet.gridColumns,
      }),
    );
  }

  if (boardSet.license) {
    labels.push(boardSet.license);
  }

  return labels;
}
