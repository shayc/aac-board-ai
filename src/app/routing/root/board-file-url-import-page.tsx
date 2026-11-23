import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { m } from "@paraglide/messages.js";
import { isolateBidi } from "@shared/language/bidi-isolate";
import { useTranslate } from "@shared/language/use-translate";
import { LoadingState } from "@shared/ui/loading-state";
import { useId, useState } from "react";
import { useLoaderData, useNavigate, useSubmit } from "react-router";
import type { rootIndexLoader } from "./root-index-route";

export function BoardFileURLImportPage() {
  const { boardFileHost } = useLoaderData<typeof rootIndexLoader>();
  const submit = useSubmit();
  const navigate = useNavigate();
  const t = useTranslate();
  const descriptionId = useId();
  // Hide the import buttons on the next render even if navigation is still idle.
  const [hasAnswered, setHasAnswered] = useState(false);

  if (hasAnswered) {
    return <LoadingState />;
  }

  function handleCancel() {
    setHasAnswered(true);
    void navigate("/", { replace: true });
  }

  function handleConfirm() {
    setHasAnswered(true);
    // Replace the link's history entry so Back doesn't offer the import again.
    void submit(null, { method: "post", replace: true });
  }

  return (
    <>
      <title>{t(m.boardFileURLImportTitle)}</title>
      <Dialog aria-describedby={descriptionId} open onClose={handleCancel}>
        <DialogTitle>{t(m.boardFileURLImportTitle)}</DialogTitle>

        <DialogContent>
          <DialogContentText
            id={descriptionId}
            sx={{ overflowWrap: "anywhere" }}
          >
            {t(m.boardFileURLImportDescription, {
              host: isolateBidi(boardFileHost),
            })}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancel}>
            {t(m.boardFileURLImportCancel)}
          </Button>
          <Button onClick={handleConfirm}>
            {t(m.boardFileURLImportConfirm)}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
