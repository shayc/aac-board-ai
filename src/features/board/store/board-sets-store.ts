import {
  importFiles,
  type ImportResult,
} from "@features/board/db/board-import";
import {
  deleteBoardSet,
  listBoardSets,
  openBoardsDB,
  type BoardSetRecord,
} from "@features/board/db/boards-db";

export interface BoardSetsSnapshot {
  data: BoardSetRecord[];
  isLoading: boolean;
  error: Error | null;
}

const listeners = new Set<() => void>();
let snapshot: BoardSetsSnapshot = { data: [], isLoading: true, error: null };
let fetched = false;
let pending: Promise<void> | null = null;

function emit() {
  for (const cb of listeners) {
    cb();
  }
}

async function refresh(): Promise<void> {
  try {
    const db = await openBoardsDB();

    try {
      const data = await listBoardSets(db);
      snapshot = { data, isLoading: false, error: null };
      fetched = true;
    } finally {
      db.close();
    }
  } catch (err) {
    snapshot = {
      data: [],
      isLoading: false,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  } finally {
    pending = null;
  }

  emit();
}

function ensureFetched() {
  if (!fetched && !pending) {
    pending = refresh();
  }
}

export function subscribeBoardSets(callback: () => void): () => void {
  listeners.add(callback);
  ensureFetched();

  return () => {
    listeners.delete(callback);
  };
}

export function getBoardSetsSnapshot(): BoardSetsSnapshot {
  ensureFetched();
  return snapshot;
}

export async function fetchBoardSets(): Promise<BoardSetRecord[]> {
  if (pending) {
    await pending;
  } else if (!fetched) {
    await refresh();
  }

  return snapshot.data;
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

export async function removeBoardSet(setId: string): Promise<void> {
  const db = await openBoardsDB();

  try {
    await deleteBoardSet(db, setId);
  } finally {
    db.close();
  }

  await invalidateBoardSets();
  channel.postMessage("invalidate");
}

const channel = new BroadcastChannel("board-sets-sync");
channel.addEventListener("message", () => {
  void invalidateBoardSets();
});
