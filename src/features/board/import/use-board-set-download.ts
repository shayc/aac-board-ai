import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useEffect, useEffectEvent, useSyncExternalStore } from "react";
import {
  cancelBoardSetDownload,
  downloadBoardSet,
  getDownloadPhasesSnapshot,
  getPendingBoardSetDownload,
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
  onDownloaded,
}: {
  name: string;
  url: string;
  onDownloaded: (boardSetId: string) => void;
}): UseBoardSetDownloadReturn {
  const { showSnackbar } = useSnackbar();
  const phase = useSyncExternalStore(subscribeDownloadPhases, () =>
    getDownloadPhasesSnapshot().get(url),
  );
  const isPending = phase !== undefined;
  const notifyDownloaded = useEffectEvent(onDownloaded);

  useEffect(() => {
    if (!isPending) {
      return;
    }

    void getPendingBoardSetDownload(url)?.then(
      (importedBoardSet) => {
        if (importedBoardSet) {
          notifyDownloaded(importedBoardSet.id);
        }
      },
      () => undefined,
    );
  }, [url, isPending]);

  async function download() {
    if (isPending) {
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
