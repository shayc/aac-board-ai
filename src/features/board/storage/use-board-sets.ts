import { useSyncExternalStore } from "react";
import { getBoardSetsSnapshot, subscribeBoardSets } from "./board-sets-store";
import type { BoardSetRecord } from "./boards-db";

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
