import {
  createExternalStore,
  patchState,
  useExternalStore,
} from "@shared/stores/external-store";
import { revokeAssetURLsExcept } from "../storage/asset-urls";
import {
  type BoardSetInput,
  type BoardSetRecord,
  type BoardSetTranslations,
  deleteBoardSetRecords,
  insertBoardSetRecords,
  listBoardSetRecords,
  updateBoardSetTranslations,
} from "../storage/board-set-storage";
import { requestPersistentStorage } from "../storage/request-persistent-storage";

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

const boardSetsSyncChannel = new BroadcastChannel("board-sets-sync");

export async function refreshBoardSets(): Promise<void> {
  try {
    const boardSets = await listBoardSetRecords();
    // URLs are per tab, and every tab refreshes after a delete.
    revokeAssetURLsExcept(new Set(boardSets.map((boardSet) => boardSet.id)));
    boardSetsStore.setState({ boardSets, isLoading: false, error: undefined });
  } catch (error) {
    patchState(boardSetsStore, {
      isLoading: false,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }
}

async function syncBoardSets(): Promise<void> {
  await refreshBoardSets();
  boardSetsSyncChannel.postMessage(undefined);
}

boardSetsSyncChannel.addEventListener("message", () => {
  void refreshBoardSets();
});

void refreshBoardSets();

export function useBoardSets(): BoardSetsSnapshot {
  return useExternalStore(boardSetsStore);
}

export async function createBoardSet(input: BoardSetInput): Promise<void> {
  await insertBoardSetRecords(input);
  requestPersistentStorage();
  await syncBoardSets();
}

export async function deleteBoardSet(boardSetId: string): Promise<void> {
  await deleteBoardSetRecords(boardSetId);
  await syncBoardSets();
}

export async function saveBoardSetTranslations(
  boardSetId: string,
  language: string,
  translations: BoardSetTranslations,
): Promise<void> {
  await updateBoardSetTranslations(boardSetId, language, translations);
  await syncBoardSets();
}
