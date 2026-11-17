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

const FIRST_STRONG_ISOLATE = "\u2068";
const POP_DIRECTIONAL_ISOLATE = "\u2069";

export function BoardFileURLImportPage() {
  const { boardFileHost } = useLoaderData<typeof rootIndexLoader>();
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
      <title>{t(m.boardFileURLImportTitle)}</title>
      <Dialog aria-describedby={descriptionId} open onClose={cancel}>
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
          <Button onClick={cancel}>{t(m.boardFileURLImportCancel)}</Button>
          <Button onClick={confirmImport}>
            {t(m.boardFileURLImportConfirm)}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// FSI/PDI preserve host order in RTL translations, including digit-led hosts.
function isolateBidi(text: string): string {
  return `${FIRST_STRONG_ISOLATE}${text}${POP_DIRECTIONAL_ISOLATE}`;
}
