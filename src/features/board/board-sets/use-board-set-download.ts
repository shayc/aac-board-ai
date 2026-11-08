import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import {
  cancelBoardSetDownload,
  downloadBoardSet,
  useDownloadPhase,
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
  const phase = useDownloadPhase(url);

  async function download() {
    if (phase) {
      return;
    }

    try {
      const importedBoardSet = await downloadBoardSet(url);
      if (!importedBoardSet) {
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
