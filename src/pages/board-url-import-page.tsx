import type { RootIndexData } from "@app/routing/loaders/root-index-loader";
import { boardSetPath, importBoardFromUrl } from "@features/board";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";

// Rendered only when rootIndexLoader returns a pending import instead of
// redirecting: the ?board= link targets an existing set, and replacing a
// user's vocabulary requires their explicit confirmation.
export const Component = function BoardUrlImportPage() {
  const { pendingImport } = useLoaderData<RootIndexData>();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);

  async function confirmImport() {
    setImporting(true);
    showSnackbar({ message: m.libraryImportingBoards({ count: 1 }) });

    try {
      const result = await importBoardFromUrl(pendingImport.boardUrl);

      showSnackbar({
        message: m.libraryReplacedBoards({ count: 1 }),
        severity: "success",
      });
      await navigate(boardSetPath(result), { replace: true });
    } catch {
      showSnackbar({ message: m.boardUrlImportFailed(), severity: "error" });
      await navigate("/", { replace: true });
    }
  }

  function cancelImport() {
    void navigate("/", { replace: true });
  }

  return (
    <Dialog
      open
      onClose={importing ? undefined : cancelImport}
      aria-labelledby="board-url-import-title"
      aria-describedby="board-url-import-description"
    >
      <DialogTitle id="board-url-import-title">
        {m.boardUrlReplaceConfirmTitle({ name: pendingImport.boardSetName })}
      </DialogTitle>

      <DialogContent>
        <DialogContentText id="board-url-import-description">
          {m.boardUrlReplaceConfirmDescription()}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={cancelImport} disabled={importing}>
          {m.libraryCancel()}
        </Button>
        <Button
          onClick={() => void confirmImport()}
          color="error"
          disabled={importing}
        >
          {m.boardUrlReplace()}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
