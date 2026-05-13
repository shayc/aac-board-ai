import type { BoardSetRecord } from "@features/board";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

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
        Delete "{boardSet?.name}"?
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="delete-dialog-description">
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
