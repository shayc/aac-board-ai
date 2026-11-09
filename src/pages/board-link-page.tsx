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
import { useId } from "react";
import {
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "react-router";

export function BoardLinkPage() {
  const { boardHost } = useLoaderData<typeof rootIndexLoader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const navigate = useNavigate();
  const t = useTranslate();
  const descriptionId = useId();

  if (navigation.state !== "idle") {
    return <LoadingState />;
  }

  function cancel() {
    void navigate("/", { replace: true });
  }

  function confirmImport() {
    void submit(null, { method: "post" });
  }

  return (
    <>
      <title>{t(m.boardLinkImportTitle)}</title>
      <Dialog aria-describedby={descriptionId} open onClose={cancel}>
        <DialogTitle>{t(m.boardLinkImportTitle)}</DialogTitle>

        <DialogContent>
          <DialogContentText id={descriptionId}>
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
