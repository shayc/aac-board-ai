import { createExternalStore } from "@shared/utils/external-store";
import {
  importBoardFiles as writeBoardFiles,
  type ImportResult,
} from "./board-import";
import {
  deleteBoardSet,
  listBoardSets,
  withBoardsDB,
  type BoardSetRecord,
} from "./boards-db";

export interface BoardSetsSnapshot {
  boardSets: BoardSetRecord[];
  isLoading: boolean;
  error: Error | null;
}

const boardSetsSyncChannel = new BroadcastChannel("board-sets-sync");

const store = createExternalStore<BoardSetsSnapshot>({
  boardSets: [],
  isLoading: true,
  error: null,
});

let hasLoaded = false;
let pendingLoad: Promise<void> | null = null;

async function loadBoardSets(): Promise<void> {
  try {
    const boardSets = await withBoardsDB((db) => listBoardSets(db));
    store.setState({ boardSets, isLoading: false, error: null });
    hasLoaded = true;
  } catch (error) {
    store.setState({
      boardSets: [],
      isLoading: false,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  } finally {
    pendingLoad = null;
  }
}

function ensureLoaded(): void {
  if (!hasLoaded && !pendingLoad) {
    pendingLoad = loadBoardSets();
  }
}

async function reloadAndBroadcast(): Promise<void> {
  await invalidateBoardSets();
  boardSetsSyncChannel.postMessage("invalidate");
}

export function subscribeBoardSets(listener: () => void): () => void {
  const unsubscribe = store.subscribe(listener);
  ensureLoaded();
  return unsubscribe;
}

export function getBoardSetsSnapshot(): BoardSetsSnapshot {
  ensureLoaded();
  return store.getSnapshot();
}

export async function getBoardSets(): Promise<BoardSetRecord[]> {
  if (pendingLoad) {
    await pendingLoad;
  } else if (!hasLoaded) {
    await loadBoardSets();
  }

  return store.getSnapshot().boardSets;
}

export async function invalidateBoardSets(): Promise<void> {
  pendingLoad = loadBoardSets();
  await pendingLoad;
}

export async function importBoardFiles(
  files: File | File[],
): Promise<ImportResult[]> {
  const results = await writeBoardFiles(files);
  await reloadAndBroadcast();
  return results;
}

export async function importBoardFromUrl(url: string): Promise<ImportResult> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch board: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  const pathname = new URL(url, window.location.origin).pathname;
  const filename = pathname.split("/").at(-1) ?? "board.obz";

  const file = new File([blob], filename, {
    type: blob.type || "application/octet-stream",
  });

  const [result] = await importBoardFiles(file);
  return result;
}

export async function removeBoardSet(setId: string): Promise<void> {
  await withBoardsDB((db) => deleteBoardSet(db, setId));
  await reloadAndBroadcast();
}

boardSetsSyncChannel.addEventListener("message", () => {
  void invalidateBoardSets();
});
