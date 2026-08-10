import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import type { BoardSetRecord } from "../storage/board-set-storage";

interface BoardSetDeleteDialogProps {
  boardSet: BoardSetRecord | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function BoardSetDeleteDialog({
  boardSet,
  onConfirm,
  onClose,
}: BoardSetDeleteDialogProps) {
  const t = useTranslate();

  return (
    <Dialog
      open={boardSet !== null}
      onClose={onClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
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
        <Button onClick={onConfirm} color="error">
          {t(m.libraryDelete)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
