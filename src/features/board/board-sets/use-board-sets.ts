import { useSyncExternalStore } from "react";
import {
  getBoardSetsSnapshot,
  subscribeBoardSets,
  type BoardSetsSnapshot,
} from "./board-sets-store";

export function useBoardSets(): BoardSetsSnapshot {
  return useSyncExternalStore(subscribeBoardSets, getBoardSetsSnapshot);
}
