import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { m } from "@paraglide/messages.js";
import { useTranslate, type Translate } from "@shared/language/use-translate";
import type { BoardSetRecord } from "../storage/boards-db";

interface BoardSetInfoDialogProps {
  boardSet: BoardSetRecord | null;
  onClose: () => void;
}

export function BoardSetInfoDialog({
  boardSet,
  onClose,
}: BoardSetInfoDialogProps) {
  const t = useTranslate();
  const chipLabels = boardSet ? buildChipLabels(t, boardSet) : [];

  return (
    <Dialog
      open={boardSet !== null}
      onClose={onClose}
      aria-labelledby="info-dialog-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="info-dialog-title">
        {boardSet?.name}
        {boardSet?.author && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t(m.libraryByAuthor, { author: boardSet.author })}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ overflowX: "hidden", overflowY: "auto" }}>
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
