import { useSyncExternalStore } from "react";
import {
  getBoardSetsSnapshot,
  subscribeBoardSets,
  type BoardSetsSnapshot,
} from "./board-sets-store";

export function useBoardSets(): BoardSetsSnapshot {
  const { boardSets, isLoading, error } = useSyncExternalStore(
    subscribeBoardSets,
    getBoardSetsSnapshot,
  );

  return { boardSets, isLoading, error };
}
