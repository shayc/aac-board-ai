import {
  importFiles,
  type ImportResult,
} from "@features/board/db/board-import";
import {
  deleteBoardSet,
  listBoardSets,
  withBoardsDB,
  type BoardSetRecord,
} from "@features/board/db/boards-db";
import { createExternalStore } from "@shared/utils/external-store";

export interface BoardSetsSnapshot {
  boardSets: BoardSetRecord[];
  isLoading: boolean;
  error: Error | null;
}

const store = createExternalStore<BoardSetsSnapshot>({
  boardSets: [],
  isLoading: true,
  error: null,
});

let fetched = false;
let pending: Promise<void> | null = null;

async function refresh(): Promise<void> {
  try {
    const boardSets = await withBoardsDB((db) => listBoardSets(db));
    store.setState({ boardSets, isLoading: false, error: null });
    fetched = true;
  } catch (err) {
    store.setState({
      boardSets: [],
      isLoading: false,
      error: err instanceof Error ? err : new Error(String(err)),
    });
  } finally {
    pending = null;
  }
}

function ensureFetched() {
  if (!fetched && !pending) {
    pending = refresh();
  }
}

export function subscribeBoardSets(callback: () => void): () => void {
  const unsubscribe = store.subscribe(callback);
  ensureFetched();
  return unsubscribe;
}

export function getBoardSetsSnapshot(): BoardSetsSnapshot {
  ensureFetched();
  return store.getSnapshot();
}

export async function fetchBoardSets(): Promise<BoardSetRecord[]> {
  if (pending) {
    await pending;
  } else if (!fetched) {
    await refresh();
  }

  return store.getState().boardSets;
}

export async function invalidateBoardSets(): Promise<void> {
  pending = refresh();
  await pending;
}

export async function importBoardFiles(
  input: File | File[],
): Promise<ImportResult[]> {
  const results = await importFiles(input);
  await invalidateBoardSets();
  channel.postMessage("invalidate");
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
    type: blob.type ?? "application/octet-stream",
  });

  const [result] = await importBoardFiles(file);
  return result;
}

export async function removeBoardSet(setId: string): Promise<void> {
  await withBoardsDB((db) => deleteBoardSet(db, setId));

  await invalidateBoardSets();
  channel.postMessage("invalidate");
}

const channel = new BroadcastChannel("board-sets-sync");
channel.addEventListener("message", () => {
  void invalidateBoardSets();
});
