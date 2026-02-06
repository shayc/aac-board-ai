import type { BoardSetRecord } from "@features/board/db/boards-db";
import {
  getBoardSetsSnapshot,
  subscribeBoardSets,
} from "@features/board/store/board-sets-store";
import { useSyncExternalStore } from "react";

export interface UseBoardSetsReturn {
  boardSets: BoardSetRecord[];
  isLoading: boolean;
  error: Error | null;
}

export function useBoardSets(): UseBoardSetsReturn {
  const {
    data: boardSets,
    isLoading,
    error,
  } = useSyncExternalStore(subscribeBoardSets, getBoardSetsSnapshot);

  return { boardSets, isLoading, error };
}
