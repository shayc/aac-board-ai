import { createExternalStore } from "@shared/utils/external-store";
import { importFiles, type ImportResult } from "../import/board-import";
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

const channel = new BroadcastChannel("board-sets-sync");

const store = createExternalStore<BoardSetsSnapshot>({
  boardSets: [],
  isLoading: true,
  error: null,
});

let hasFetched = false;
let pendingRefresh: Promise<void> | null = null;

async function refresh(): Promise<void> {
  try {
    const boardSets = await withBoardsDB((db) => listBoardSets(db));
    store.setState({ boardSets, isLoading: false, error: null });
    hasFetched = true;
  } catch (error) {
    store.setState({
      boardSets: [],
      isLoading: false,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  } finally {
    pendingRefresh = null;
  }
}

function ensureFetched(): void {
  if (!hasFetched && !pendingRefresh) {
    pendingRefresh = refresh();
  }
}

async function invalidateAndBroadcast(): Promise<void> {
  await invalidateBoardSets();
  channel.postMessage("invalidate");
}

export function subscribeBoardSets(listener: () => void): () => void {
  const unsubscribe = store.subscribe(listener);
  ensureFetched();
  return unsubscribe;
}

export function getBoardSetsSnapshot(): BoardSetsSnapshot {
  ensureFetched();
  return store.getSnapshot();
}

export async function fetchBoardSets(): Promise<BoardSetRecord[]> {
  if (pendingRefresh) {
    await pendingRefresh;
  } else if (!hasFetched) {
    await refresh();
  }

  return store.getState().boardSets;
}

export async function invalidateBoardSets(): Promise<void> {
  pendingRefresh = refresh();
  await pendingRefresh;
}

export async function importBoardFiles(
  files: File | File[],
): Promise<ImportResult[]> {
  const results = await importFiles(files);
  await invalidateAndBroadcast();
  return results;
}

export async function importBoardFromUrl(url: string): Promise<ImportResult> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch board: ${response.statusText}`);
  }

  const blob = await response.blob();
  const pathname = new URL(url, window.location.origin).pathname;
  const filename = pathname.split("/").pop() ?? "board.obz";

  const file = new File([blob], filename, {
    type: blob.type || "application/octet-stream",
  });

  const [result] = await importBoardFiles(file);
  return result;
}

export async function removeBoardSet(setId: string): Promise<void> {
  await withBoardsDB((db) => deleteBoardSet(db, setId));
  await invalidateAndBroadcast();
}

channel.addEventListener("message", () => {
  void invalidateBoardSets();
});
