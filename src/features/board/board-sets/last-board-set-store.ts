import { createPersistedStore } from "@shared/state/persisted-store";
import type { BoardSetRecord } from "./board-sets-store";

const lastBoardSetStore = createPersistedStore<string | null>(
  "last-board-set",
  (raw) => (typeof raw === "string" ? raw : null),
);

export function rememberBoardSet(boardSetId: string): void {
  lastBoardSetStore.setState(boardSetId);
}

export function selectLaunchBoardSet(
  boardSets: readonly BoardSetRecord[],
): BoardSetRecord | undefined {
  const lastBoardSetId = lastBoardSetStore.getSnapshot();

  return (
    boardSets.find((boardSet) => boardSet.id === lastBoardSetId) ?? boardSets[0]
  );
}
