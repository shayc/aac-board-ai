import type { BoardSetRecord } from "@features/board";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getLanguageDisplayName } from "@shared/language/locale";

export interface BoardSetInfoDialogProps {
  boardSet: BoardSetRecord | null;
  onClose: () => void;
}

export function BoardSetInfoDialog({
  boardSet,
  onClose,
}: BoardSetInfoDialogProps) {
  const chips = boardSet ? buildChips(boardSet) : [];

  return (
    <Dialog
      open={boardSet !== null}
      onClose={onClose}
      aria-labelledby="info-dialog-title"
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle id="info-dialog-title">
        {boardSet?.name}
        {boardSet?.author && (
          <Typography variant="body2" color="text.secondary">
            By {boardSet.author}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ overflowX: "hidden", overflowY: "auto" }}>
        {chips.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            {chips.map((label) => (
              <Chip key={label} label={label} size="small" variant="outlined" />
            ))}
          </Stack>
        )}

        {boardSet?.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, whiteSpace: "pre-line" }}
          >
            {boardSet.description}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function buildChips(boardSet: BoardSetRecord): string[] {
  const chips: string[] = [];

  if (boardSet.gridRows && boardSet.gridColumns) {
    chips.push(`${boardSet.gridRows}×${boardSet.gridColumns} Grid`);
  }

  if (boardSet.locale) {
    chips.push(getLanguageDisplayName(boardSet.locale));
  }

  if (boardSet.license) {
    chips.push(boardSet.license);
  }

  return chips;
}
