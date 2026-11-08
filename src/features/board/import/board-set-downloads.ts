import { createExternalStore } from "@shared/state/external-store";
import type { ImportedBoardSet } from "./board-import";
import {
  importBoardFileFromURL,
  type DownloadProgress,
} from "./import-from-url";

export type BoardSetDownloadPhase =
  | ({ kind: "downloading" } & DownloadProgress)
  | { kind: "importing" };

export const BYTES_PER_MEGABYTE = 1_000_000;

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

function visibleProgressStep({ loaded, total }: DownloadProgress): number {
  if (total === undefined) {
    return Math.floor(loaded / BYTES_PER_MEGABYTE);
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

function announceCompletedDownload(
  importedBoardSet: ImportedBoardSet,
): ImportedBoardSet {
  for (const listener of completedDownloadListeners) {
    listener(importedBoardSet.id);
  }

  return importedBoardSet;
}

export function downloadBoardSet(
  url: string,
): Promise<ImportedBoardSet | undefined> {
  const pendingDownload = pendingDownloadsByURL.get(url);
  if (pendingDownload) {
    return pendingDownload.promise;
  }

  const controller = new AbortController();
  const promise = importBoardFileFromURL(url, {
    signal: controller.signal,
    onProgress: (progress) => publishProgress(url, progress),
    onImportStart: () => setDownloadPhase(url, { kind: "importing" }),
  })
    .then(announceCompletedDownload)
    .catch((error: unknown) => {
      if (controller.signal.aborted) {
        return undefined;
      }

      throw error;
    })
    .finally(() => {
      pendingDownloadsByURL.delete(url);
      setDownloadPhase(url);
    });

  pendingDownloadsByURL.set(url, { promise, controller });
  setDownloadPhase(url, { kind: "downloading", loaded: 0 });

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
  if (downloadPhasesStore.getSnapshot().get(url)?.kind !== "downloading") {
    return;
  }

  pendingDownloadsByURL.get(url)?.controller.abort();
}

export const subscribeDownloadPhases = downloadPhasesStore.subscribe;
export const getDownloadPhasesSnapshot = downloadPhasesStore.getSnapshot;
