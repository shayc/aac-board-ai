import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useSyncExternalStore } from "react";
import {
  cancelBoardSetDownload,
  downloadBoardSet,
  getDownloadPhasesSnapshot,
  subscribeDownloadPhases,
  type BoardSetDownloadPhase,
} from "./board-set-downloads";

interface UseBoardSetDownloadReturn {
  phase: BoardSetDownloadPhase | undefined;
  download: () => Promise<void>;
  cancel: () => void;
}

export function useBoardSetDownload({
  name,
  url,
}: {
  name: string;
  url: string;
}): UseBoardSetDownloadReturn {
  const { showSnackbar } = useSnackbar();
  const phase = useSyncExternalStore(subscribeDownloadPhases, () =>
    getDownloadPhasesSnapshot().get(url),
  );

  async function download() {
    if (phase) {
      return;
    }

    showSnackbar({
      message: (t) => t(m.libraryDownloadingBoardSet, { name }),
    });

    try {
      const importedBoardSet = await downloadBoardSet(url);
      if (!importedBoardSet) {
        showSnackbar({
          message: (t) => t(m.libraryDownloadCanceled, { name }),
        });
        return;
      }

      showSnackbar({
        message: (t) => t(m.libraryDownloadedBoardSet, { name }),
        severity: "success",
      });
    } catch {
      showSnackbar({
        message: (t) => t(m.libraryDownloadFailed, { name }),
        severity: "error",
      });
    }
  }

  function cancel() {
    cancelBoardSetDownload(url);
  }

  return { phase, download, cancel };
}
