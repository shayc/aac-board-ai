import { createExternalStore } from "@shared/utils/external-store";
import {
  deleteBoardSetData,
  listBoardSets,
  type BoardSetRecord,
} from "../storage/boards-db";

export interface BoardSetsSnapshot {
  boardSets: BoardSetRecord[];
  isLoading: boolean;
  error: Error | null;
}

const boardSetsSyncChannel = new BroadcastChannel("board-sets-sync");
boardSetsSyncChannel.addEventListener("message", () => {
  void invalidateBoardSets();
});

const store = createExternalStore<BoardSetsSnapshot>({
  boardSets: [],
  isLoading: true,
  error: null,
});

let hasLoaded = false;
let pendingLoad: Promise<void> | null = null;

async function loadBoardSets(): Promise<void> {
  try {
    const boardSets = await listBoardSets();
    store.setState({ boardSets, isLoading: false, error: null });
    hasLoaded = true;
  } catch (error) {
    const { boardSets } = store.getSnapshot();
    store.setState({
      boardSets,
      isLoading: false,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  } finally {
    pendingLoad = null;
  }
}

function ensureLoaded(): Promise<void> {
  if (!hasLoaded && !pendingLoad) {
    pendingLoad = loadBoardSets();
  }

  return pendingLoad ?? Promise.resolve();
}

export async function invalidateBoardSets(): Promise<void> {
  pendingLoad = loadBoardSets();
  await pendingLoad;
}

export async function notifyBoardSetsChanged(): Promise<void> {
  await invalidateBoardSets();
  boardSetsSyncChannel.postMessage("invalidate");
}

export function subscribeBoardSets(listener: () => void): () => void {
  const unsubscribe = store.subscribe(listener);
  void ensureLoaded();

  return unsubscribe;
}

export function getBoardSetsSnapshot(): BoardSetsSnapshot {
  return store.getSnapshot();
}

export async function getBoardSets(): Promise<BoardSetRecord[]> {
  await ensureLoaded();

  return store.getSnapshot().boardSets;
}

export async function deleteBoardSet(setId: string): Promise<void> {
  await deleteBoardSetData(setId);
  await notifyBoardSetsChanged();
}
