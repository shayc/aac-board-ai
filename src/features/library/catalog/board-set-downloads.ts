import {
  createExternalStore,
  useExternalStore,
} from "@shared/stores/external-store";
import type { ImportedBoardSet } from "../import/board-file-import";
import {
  type DownloadProgress,
  importBoardFileFromURL,
} from "../import/import-from-url";

export type BoardSetDownloadPhase =
  | { kind: "connecting" }
  | ({ kind: "downloading" } & DownloadProgress)
  | { kind: "importing" };

export interface CompletedDownload {
  boardSetId: string;
}

interface DownloadsState {
  phases: ReadonlyMap<string, BoardSetDownloadPhase>;
  // A new object per completion, so a list can tell completions it has seen
  // from ones that happen while it is open.
  lastCompletion: CompletedDownload | undefined;
}

interface PendingDownload {
  promise: Promise<ImportedBoardSet | undefined>;
  controller: AbortController;
}

const pendingDownloadsByURL = new Map<string, PendingDownload>();
const downloadsStore = createExternalStore<DownloadsState>({
  phases: new Map(),
  lastCompletion: undefined,
});

function setDownloadPhase(url: string, phase: BoardSetDownloadPhase) {
  const state = downloadsStore.getSnapshot();
  const phases = new Map(state.phases);
  phases.set(url, phase);

  downloadsStore.setState({ ...state, phases });
}

// Clears the phase and records the completion in one update, so the stored
// entry never renders without knowing it was just downloaded.
function settleDownload(url: string, completion?: CompletedDownload) {
  pendingDownloadsByURL.delete(url);

  const state = downloadsStore.getSnapshot();
  const phases = new Map(state.phases);
  phases.delete(url);

  downloadsStore.setState({
    phases,
    lastCompletion: completion ?? state.lastCompletion,
  });
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
  const phase = downloadsStore.getSnapshot().phases.get(url);
  const isUnchanged =
    phase?.kind === "downloading" &&
    phase.total === progress.total &&
    visibleProgressStep(phase) === visibleProgressStep(progress);
  if (isUnchanged) {
    return;
  }

  setDownloadPhase(url, { kind: "downloading", ...progress });
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
    settleDownload(url, { boardSetId: importedBoardSet.id });

    return importedBoardSet;
  } catch (error) {
    settleDownload(url);
    if (signal.aborted) {
      return undefined;
    }

    throw error;
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

export function cancelBoardSetDownload(url: string) {
  // Once local importing starts, its atomic write is left to finish.
  if (downloadsStore.getSnapshot().phases.get(url)?.kind === "importing") {
    return;
  }

  pendingDownloadsByURL.get(url)?.controller.abort();
}

export function useBoardSetDownloadPhase(
  url: string,
): BoardSetDownloadPhase | undefined {
  return useExternalStore(downloadsStore, (state) => state.phases.get(url));
}

export function useBoardSetDownloadPhases(): ReadonlyMap<
  string,
  BoardSetDownloadPhase
> {
  return useExternalStore(downloadsStore, (state) => state.phases);
}

export function useLastCompletedDownload(): CompletedDownload | undefined {
  return useExternalStore(downloadsStore, (state) => state.lastCompletion);
}
