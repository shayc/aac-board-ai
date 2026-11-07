import { createExternalStore } from "@shared/state/external-store";
import type { ImportedBoardSet } from "./board-import";
import { importBoardFileFromURL } from "./import-from-url";

const downloadsByURL = new Map<string, Promise<ImportedBoardSet>>();
const downloadingURLsStore = createExternalStore<ReadonlySet<string>>(
  new Set(),
);

function publishDownloadingURLs() {
  downloadingURLsStore.setState(new Set(downloadsByURL.keys()));
}

export function downloadBoardSet(url: string): Promise<ImportedBoardSet> {
  const pendingDownload = downloadsByURL.get(url);
  if (pendingDownload) {
    return pendingDownload;
  }

  const download = importBoardFileFromURL(url).finally(() => {
    downloadsByURL.delete(url);
    publishDownloadingURLs();
  });

  downloadsByURL.set(url, download);
  publishDownloadingURLs();

  return download;
}

export const subscribeDownloadingURLs = downloadingURLsStore.subscribe;
export const getDownloadingURLsSnapshot = downloadingURLsStore.getSnapshot;
