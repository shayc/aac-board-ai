import { useSyncExternalStore } from "react";
import type { BoardSetRecord } from "../storage/board-set-storage";
import { getBoardSetsSnapshot, subscribeBoardSets } from "./board-sets-store";

interface UseBoardSetsReturn {
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
