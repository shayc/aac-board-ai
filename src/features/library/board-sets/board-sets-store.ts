import {
  createExternalStore,
  useExternalStore,
} from "@shared/state/external-store";
import { revokeAssetURLsExcept } from "../storage/asset-urls";
import {
  insertBoardSet,
  listBoardSetRecords,
  removeBoardSet,
  type BoardSetInput,
  type BoardSetRecord,
} from "../storage/board-set-storage";

export interface BoardSetsSnapshot {
  boardSets: readonly BoardSetRecord[];
  isLoading: boolean;
  error: Error | undefined;
}

const boardSetsStore = createExternalStore<BoardSetsSnapshot>({
  boardSets: [],
  isLoading: true,
  error: undefined,
});

export async function refreshBoardSets(): Promise<void> {
  try {
    const boardSets = await listBoardSetRecords();
    // URLs are per tab, and every tab refreshes after a delete.
    revokeAssetURLsExcept(new Set(boardSets.map((boardSet) => boardSet.id)));
    boardSetsStore.setState({ boardSets, isLoading: false, error: undefined });
  } catch (error) {
    boardSetsStore.setState((snapshot) => ({
      ...snapshot,
      isLoading: false,
      error: error instanceof Error ? error : new Error(String(error)),
    }));
  }
}

export async function syncBoardSets(): Promise<void> {
  await refreshBoardSets();
  boardSetsSyncChannel.postMessage(undefined);
}

const boardSetsSyncChannel = new BroadcastChannel("board-sets-sync");
boardSetsSyncChannel.addEventListener("message", () => {
  void refreshBoardSets();
});

void refreshBoardSets();

export function useBoardSets(): BoardSetsSnapshot {
  return useExternalStore(boardSetsStore);
}

export async function createBoardSet(input: BoardSetInput): Promise<void> {
  await insertBoardSet(input);
  await syncBoardSets();
}

export async function deleteBoardSet(boardSetId: string): Promise<void> {
  await removeBoardSet(boardSetId);
  await syncBoardSets();
}
