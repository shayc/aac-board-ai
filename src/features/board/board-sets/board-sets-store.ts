import { createExternalStore } from "@shared/state/external-store";
import { revokeAssetUrlsExcept } from "../storage/asset-urls";
import {
  createStoredBoardSet,
  deleteStoredBoardSet,
  listStoredBoardSets,
  type BoardSetInput,
  type BoardSetRecord,
} from "../storage/board-set-storage";

export interface BoardSetsSnapshot {
  boardSets: BoardSetRecord[];
  isLoading: boolean;
  error: Error | undefined;
}

const boardSetsSyncChannel = new BroadcastChannel("board-sets-sync");
boardSetsSyncChannel.addEventListener("message", () => {
  void refreshBoardSets();
});

const boardSetsStore = createExternalStore<BoardSetsSnapshot>({
  boardSets: [],
  isLoading: true,
  error: undefined,
});

let hasLoaded = false;
let pendingLoad: Promise<void> | null = null;

async function loadBoardSets(): Promise<void> {
  try {
    const boardSets = await listStoredBoardSets();
    // URLs are per tab, and every tab refreshes after a delete.
    revokeAssetUrlsExcept(new Set(boardSets.map((boardSet) => boardSet.id)));
    boardSetsStore.setState({ boardSets, isLoading: false, error: undefined });
    hasLoaded = true;
  } catch (error) {
    const { boardSets } = boardSetsStore.getSnapshot();
    boardSetsStore.setState({
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

async function syncBoardSets(): Promise<void> {
  await refreshBoardSets();
  boardSetsSyncChannel.postMessage(undefined);
}

export function subscribeBoardSets(listener: () => void): () => void {
  const unsubscribe = boardSetsStore.subscribe(listener);
  void ensureLoaded();

  return unsubscribe;
}

export function getBoardSetsSnapshot(): BoardSetsSnapshot {
  return boardSetsStore.getSnapshot();
}

export async function listBoardSets(): Promise<BoardSetRecord[]> {
  await ensureLoaded();

  return boardSetsStore.getSnapshot().boardSets;
}

export async function createBoardSet(input: BoardSetInput): Promise<void> {
  await createStoredBoardSet(input);
  await syncBoardSets();
}

export async function deleteBoardSet(boardSetId: string): Promise<void> {
  await deleteStoredBoardSet(boardSetId);
  await syncBoardSets();
}
