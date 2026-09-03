import { useSyncExternalStore } from "react";
import {
  getBoardSetsSnapshot,
  subscribeBoardSets,
  type BoardSetRecord,
} from "./board-sets-store";

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
