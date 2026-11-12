import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";
import type { ImportedBoardSet } from "../import/board-file-import";
import {
  type DownloadProgress,
  importBoardFileFromURL,
} from "../import/import-from-url";

export type BoardSetDownloadPhase =
  | { kind: "connecting" }
  | ({ kind: "downloading" } & DownloadProgress)
  | { kind: "importing" };

interface PendingDownload {
  promise: Promise<ImportedBoardSet | undefined>;
  controller: AbortController;
}

type CompletedDownloadListener = (boardSetId: string) => void;

const pendingDownloadsByURL = new Map<string, PendingDownload>();
const completedDownloadListeners = new Set<CompletedDownloadListener>();
const downloadPhasesStore = createExternalStore<
  ReadonlyMap<string, BoardSetDownloadPhase>
>(new Map());

function setDownloadPhase(url: string, phase?: BoardSetDownloadPhase) {
  const phases = new Map(downloadPhasesStore.getSnapshot());

  if (phase) {
    phases.set(url, phase);
  } else {
    phases.delete(url);
  }

  downloadPhasesStore.setState(phases);
}

function visibleProgressStep({
  loaded,
  total,
}: DownloadProgress): number | undefined {
  if (total === undefined) {
    return undefined;
  }

  return Math.floor((loaded / total) * 100);
}

function publishProgress(url: string, progress: DownloadProgress) {
  const phase = downloadPhasesStore.getSnapshot().get(url);
  const isUnchanged =
    phase?.kind === "downloading" &&
    phase.total === progress.total &&
    visibleProgressStep(phase) === visibleProgressStep(progress);
  if (isUnchanged) {
    return;
  }

  setDownloadPhase(url, { kind: "downloading", ...progress });
}

function announceCompletedDownload(boardSetId: string) {
  for (const listener of completedDownloadListeners) {
    listener(boardSetId);
  }
}

async function runDownload(
  url: string,
  signal: AbortSignal,
): Promise<ImportedBoardSet | undefined> {
  try {
    const importedBoardSet = await importBoardFileFromURL(url, {
      signal,
      onProgress: (progress) => publishProgress(url, progress),
      onImportStart: () => setDownloadPhase(url, { kind: "importing" }),
    });
    announceCompletedDownload(importedBoardSet.id);

    return importedBoardSet;
  } catch (error) {
    if (signal.aborted) {
      return undefined;
    }

    throw error;
  } finally {
    pendingDownloadsByURL.delete(url);
    setDownloadPhase(url);
  }
}

export function downloadBoardSet(
  url: string,
): Promise<ImportedBoardSet | undefined> {
  const pendingDownload = pendingDownloadsByURL.get(url);
  if (pendingDownload) {
    return pendingDownload.promise;
  }

  const controller = new AbortController();
  const promise = runDownload(url, controller.signal);
  pendingDownloadsByURL.set(url, { promise, controller });
  setDownloadPhase(url, { kind: "connecting" });

  return promise;
}

export function subscribeCompletedDownloads(
  listener: CompletedDownloadListener,
): () => void {
  completedDownloadListeners.add(listener);

  return () => {
    completedDownloadListeners.delete(listener);
  };
}

export function cancelBoardSetDownload(url: string) {
  // Once local importing starts, its atomic write is left to finish.
  if (downloadPhasesStore.getSnapshot().get(url)?.kind === "importing") {
    return;
  }

  pendingDownloadsByURL.get(url)?.controller.abort();
}

export function useBoardSetDownloadPhase(
  url: string,
): BoardSetDownloadPhase | undefined {
  return useExternalStore(downloadPhasesStore, (phases) => phases.get(url));
}
