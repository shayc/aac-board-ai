import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { m } from "@paraglide/messages.js";
import { useLastNonNull } from "@shared/hooks/use-last-non-null";
import { useTranslate } from "@shared/language/use-translate";
import { useId } from "react";
import type { BoardSetRecord } from "../storage/board-set-storage";

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
  const descriptionId = useId();
  const shownBoardSet = useLastNonNull(boardSet);

  return (
    <Dialog
      aria-describedby={descriptionId}
      open={boardSet !== null}
      onClose={onClose}
    >
      <DialogTitle>{t(m.libraryDeleteConfirmTitle)}</DialogTitle>

      <DialogContent>
        <DialogContentText id={descriptionId}>
          {shownBoardSet
            ? t(m.libraryDeleteIrreversible, { name: shownBoardSet.name })
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
