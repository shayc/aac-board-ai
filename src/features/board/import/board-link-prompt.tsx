import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { m } from "@paraglide/messages.js";
import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useTranslate } from "@shared/language/use-translate";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { rootBoardPath } from "../navigation/board-paths";
import type { ImportedBoardSet } from "./board-import";
import { getBoardUrlHost, importBoardSetFromUrl } from "./import-from-url";

const BOARD_LINK_PARAM = "board";

// A link is the one import path someone else starts, so it asks first and
// nothing is downloaded or stored until the user accepts.
export function BoardLinkPrompt() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const boardUrl = searchParams.get(BOARD_LINK_PARAM);

  if (!boardUrl) {
    return null;
  }

  function handleClose() {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete(BOARD_LINK_PARAM);

        return next;
      },
      { replace: true },
    );
  }

  function handleImported(boardSet: ImportedBoardSet) {
    showSnackbar({
      message: (translate) =>
        translate(m.libraryImportedBoardSets, { count: 1 }),
      severity: "success",
    });
    void navigate(rootBoardPath(boardSet), { replace: true });
  }

  return (
    <BoardLinkDialog
      key={boardUrl}
      boardUrl={boardUrl}
      onClose={handleClose}
      onImported={handleImported}
    />
  );
}

interface BoardLinkDialogProps {
  boardUrl: string;
  onClose: () => void;
  onImported: (boardSet: ImportedBoardSet) => void;
}

function BoardLinkDialog({
  boardUrl,
  onClose,
  onImported,
}: BoardLinkDialogProps) {
  const t = useTranslate();
  const descriptionId = useId();
  const host = getBoardUrlHost(boardUrl);

  const [attemptCount, setAttemptCount] = useState(0);
  const { error, isPending } = useLatestAsync({
    enabled: attemptCount > 0,
    deps: [attemptCount],
    run: async (signal) => {
      const boardSet = await importBoardSetFromUrl(boardUrl, signal);
      signal.throwIfAborted();
      onImported(boardSet);
    },
  });

  const hasFailed = !host || Boolean(error);

  return (
    <Dialog aria-describedby={descriptionId} open onClose={onClose}>
      <DialogTitle>{t(m.boardLinkTitle)}</DialogTitle>

      <DialogContent id={descriptionId}>
        {host && (
          <DialogContentText sx={{ fontWeight: "bold" }}>
            {t(m.boardLinkSource, { host })}
          </DialogContentText>
        )}

        {hasFailed ? (
          <Alert severity="error" sx={{ mt: 1 }}>
            {t(m.errorBoardUrlImportFailed)}
          </Alert>
        ) : (
          <DialogContentText>{t(m.boardLinkTrustWarning)}</DialogContentText>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          {host ? t(m.libraryCancel) : t(m.close)}
        </Button>

        {host && (
          <Button
            loading={isPending}
            onClick={() => setAttemptCount((count) => count + 1)}
          >
            {error ? t(m.boardLinkRetry) : t(m.boardLinkAdd)}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
