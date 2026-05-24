import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { m } from "@paraglide/messages.js";
import type { BoardSetRecord } from "../storage/db";

export interface BoardSetDeleteDialogProps {
  boardSet: BoardSetRecord | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function BoardSetDeleteDialog({
  boardSet,
  onConfirm,
  onClose,
}: BoardSetDeleteDialogProps) {
  return (
    <Dialog
      open={boardSet !== null}
      onClose={onClose}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <DialogTitle id="delete-dialog-title">
        {boardSet ? m.libraryDeleteConfirmTitle({ name: boardSet.name }) : null}
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          {m.libraryDeleteIrreversible()}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{m.libraryCancel()}</Button>
        <Button onClick={onConfirm} color="error">
          {m.libraryDelete()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
