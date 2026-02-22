import type { BoardSetRecord } from "@features/board/db/boards-db";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export interface BoardSetDeleteDialogProps {
  boardSet: BoardSetRecord | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BoardSetDeleteDialog({
  boardSet,
  onConfirm,
  onCancel,
}: BoardSetDeleteDialogProps) {
  return (
    <Dialog
      open={boardSet !== null}
      onClose={onCancel}
      aria-labelledby="delete-dialog-title"
    >
      <DialogTitle id="delete-dialog-title">
        Delete "{boardSet?.name}"?
      </DialogTitle>
      <DialogContent>
        <DialogContentText>This action cannot be undone.</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm} color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
