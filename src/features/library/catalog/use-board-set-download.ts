import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import {
  type BoardSetDownloadPhase,
  cancelBoardSetDownload,
  downloadBoardSet,
  useBoardSetDownloadPhase,
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
  url: string | undefined;
}): UseBoardSetDownloadReturn {
  const { showSnackbar } = useSnackbar();
  const phase = useBoardSetDownloadPhase(url);

  async function download() {
    if (url === undefined || phase) {
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
    if (url !== undefined) {
      cancelBoardSetDownload(url);
    }
  }

  return { phase, download, cancel };
}
