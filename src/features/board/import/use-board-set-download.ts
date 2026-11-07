import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useSyncExternalStore } from "react";
import type { ImportedBoardSet } from "./board-import";
import {
  cancelBoardSetDownload,
  downloadBoardSet,
  getDownloadPhasesSnapshot,
  subscribeDownloadPhases,
  type BoardSetDownloadPhase,
} from "./board-set-downloads";

interface UseBoardSetDownloadReturn {
  phase: BoardSetDownloadPhase | undefined;
  download: () => Promise<ImportedBoardSet | undefined>;
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
      return undefined;
    }

    try {
      const importedBoardSet = await downloadBoardSet(url);
      if (!importedBoardSet) {
        return undefined;
      }

      showSnackbar({
        message: (t) => t(m.libraryDownloadedBoardSet, { name }),
        severity: "success",
      });

      return importedBoardSet;
    } catch {
      showSnackbar({
        message: (t) => t(m.libraryDownloadFailed, { name }),
        severity: "error",
      });

      return undefined;
    }
  }

  function cancel() {
    cancelBoardSetDownload(url);
  }

  return { phase, download, cancel };
}
