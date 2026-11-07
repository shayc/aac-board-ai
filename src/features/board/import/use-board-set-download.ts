import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useSyncExternalStore } from "react";
import type { ImportedBoardSet } from "./board-import";
import {
  downloadBoardSet,
  getDownloadingURLsSnapshot,
  subscribeDownloadingURLs,
} from "./board-set-downloads";

interface UseBoardSetDownloadReturn {
  isDownloading: boolean;
  download: () => Promise<ImportedBoardSet | undefined>;
}

export function useBoardSetDownload({
  name,
  url,
}: {
  name: string;
  url: string;
}): UseBoardSetDownloadReturn {
  const { showSnackbar } = useSnackbar();
  const isDownloading = useSyncExternalStore(subscribeDownloadingURLs, () =>
    getDownloadingURLsSnapshot().has(url),
  );

  async function download() {
    if (isDownloading) {
      return undefined;
    }

    showSnackbar({
      message: (t) => t(m.libraryDownloadingBoardSet, { name }),
    });

    try {
      const importedBoardSet = await downloadBoardSet(url);

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

  return { isDownloading, download };
}
