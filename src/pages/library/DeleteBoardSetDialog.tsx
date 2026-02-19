import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

export interface DeleteBoardSetDialogProps {
  target: { setId: string; name: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteBoardSetDialog({
  target,
  onConfirm,
  onCancel,
}: DeleteBoardSetDialogProps) {
  return (
    <Dialog
      open={target !== null}
      onClose={onCancel}
      aria-labelledby="delete-dialog-title"
    >
      <DialogTitle id="delete-dialog-title">Delete board set?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          "{target?.name}" will be permanently deleted. This action cannot be
          undone.
        </DialogContentText>
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
