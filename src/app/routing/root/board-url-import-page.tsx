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
import type { rootIndexLoader } from "./root-index-loader";

export function BoardURLImportPage() {
  const { boardHost } = useLoaderData<typeof rootIndexLoader>();
  const submit = useSubmit();
  const navigate = useNavigate();
  const t = useTranslate();
  const descriptionId = useId();
  // Guard against duplicate taps before the router updates navigation state.
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
      <title>{t(m.boardURLImportTitle)}</title>
      <Dialog aria-describedby={descriptionId} open onClose={cancel}>
        <DialogTitle>{t(m.boardURLImportTitle)}</DialogTitle>

        <DialogContent>
          <DialogContentText
            id={descriptionId}
            sx={{ overflowWrap: "anywhere" }}
          >
            {t(m.boardURLImportDescription, {
              host: isolateBidi(boardHost),
            })}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={cancel}>{t(m.boardURLImportCancel)}</Button>
          <Button onClick={confirmImport}>{t(m.boardURLImportConfirm)}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// FSI/PDI preserve host order in RTL translations, including digit-led hosts.
function isolateBidi(text: string): string {
  return `⁨${text}⁩`;
}
