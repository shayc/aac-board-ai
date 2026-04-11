import { useSyncExternalStore } from "react";
import type { BoardSetRecord } from "../db/boards-db";
import {
  getBoardSetsSnapshot,
  subscribeBoardSets,
} from "../store/board-sets-store";

export interface UseBoardSetsReturn {
  boardSets: BoardSetRecord[];
  isLoading: boolean;
  error: Error | null;
}

export function useBoardSets(): UseBoardSetsReturn {
  const { boardSets, isLoading, error } = useSyncExternalStore(
    subscribeBoardSets,
    getBoardSetsSnapshot,
  );

  return { boardSets, isLoading, error };
}
