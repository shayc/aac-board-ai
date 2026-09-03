import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { BoardSetRecord } from "./board-sets-store";

interface BoardSetDeleteDialogProps {
  boardSet: BoardSetRecord | null;
  onDelete: () => void;
  onClose: () => void;
}

export function BoardSetDeleteDialog({
  boardSet,
  onDelete,
  onClose,
}: BoardSetDeleteDialogProps) {
  const t = useTranslate();

  return (
    <Dialog
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      open={boardSet !== null}
      onClose={onClose}
    >
      <DialogTitle id="delete-dialog-title">
        {boardSet
          ? t(m.libraryDeleteConfirmTitle, { name: boardSet.name })
          : null}
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          {boardSet
            ? t(m.libraryDeleteIrreversible, { count: boardSet.boardCount })
            : null}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t(m.libraryCancel)}</Button>
        <Button color="error" onClick={onDelete}>
          {t(m.libraryDelete)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
