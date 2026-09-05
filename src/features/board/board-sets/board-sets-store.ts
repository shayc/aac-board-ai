import { createExternalStore } from "@shared/utils/external-store";
import {
  createBoardSet as createStoredBoardSet,
  deleteBoardSet as deleteStoredBoardSet,
  getBoardSet as getStoredBoardSet,
  listBoardSets,
  type BoardSetCreateInput,
  type BoardSetRecord,
} from "../storage/board-set-storage";

export {
  BoardSetAlreadyExistsError,
  InvalidIdError,
} from "../storage/board-set-storage";
export type {
  AssetInput,
  BoardInput,
  BoardSetCreateInput,
  BoardSetInput,
  BoardSetRecord,
} from "../storage/board-set-storage";

interface BoardSetsSnapshot {
  boardSets: BoardSetRecord[];
  isLoading: boolean;
  error: Error | null;
}

const boardSetsSyncChannel = new BroadcastChannel("board-sets-sync");
boardSetsSyncChannel.addEventListener("message", () => {
  void refreshBoardSets();
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

export async function refreshBoardSets(): Promise<void> {
  pendingLoad = loadBoardSets();
  await pendingLoad;
}

export async function refreshAndBroadcastBoardSets(): Promise<void> {
  await refreshBoardSets();
  boardSetsSyncChannel.postMessage(undefined);
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
  const { boardSets, error } = store.getSnapshot();
  if (error) {
    throw error;
  }

  return boardSets;
}

export function getBoardSet(
  setId: string,
): Promise<BoardSetRecord | undefined> {
  return getStoredBoardSet(setId);
}

export async function createBoardSet(
  input: BoardSetCreateInput,
): Promise<void> {
  await createStoredBoardSet(input);
  await refreshAndBroadcastBoardSets();
}

export async function deleteBoardSet(setId: string): Promise<void> {
  await deleteStoredBoardSet(setId);
  await refreshAndBroadcastBoardSets();
}
