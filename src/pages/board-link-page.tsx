import type { rootIndexLoader } from "@app/routing/loaders/root-index-loader";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { LoadingState } from "@shared/ui/loading-state";
import { useId, useState } from "react";
import { useLoaderData, useNavigate, useSubmit } from "react-router";

export function BoardLinkPage() {
  const { boardHost } = useLoaderData<typeof rootIndexLoader>();
  const submit = useSubmit();
  const navigate = useNavigate();
  const t = useTranslate();
  const descriptionId = useId();
  // Router navigation state lags the first tap, so without this a double tap
  // lands on the still-open dialog and submits a second, duplicate import.
  const [hasAnswered, setHasAnswered] = useState(false);

  if (hasAnswered) {
    return <LoadingState />;
  }

  function cancel() {
    setHasAnswered(true);
    void navigate("/", { replace: true });
  }

  function confirmImport() {
    setHasAnswered(true);
    // Replace the link's history entry so Back doesn't offer the import again.
    void submit(null, { method: "post", replace: true });
  }

  return (
    <>
      <title>{t(m.boardLinkImportTitle)}</title>
      <Dialog aria-describedby={descriptionId} open onClose={cancel}>
        <DialogTitle>{t(m.boardLinkImportTitle)}</DialogTitle>

        <DialogContent>
          <DialogContentText
            id={descriptionId}
            sx={{ overflowWrap: "anywhere" }}
          >
            {t(m.boardLinkImportDescription, { host: boardHost })}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={cancel}>{t(m.boardLinkCancel)}</Button>
          <Button onClick={confirmImport}>{t(m.boardLinkImport)}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
