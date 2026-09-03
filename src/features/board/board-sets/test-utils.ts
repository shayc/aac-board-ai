import type { BoardSetRecord } from "./board-sets-store";

export function makeBoardSet(
  overrides: Partial<BoardSetRecord> = {},
): BoardSetRecord {
  return {
    setId: "set-1",
    name: "My Board",
    rootBoardId: "root",
    updatedAt: 0,
    boardCount: 1,
    ...overrides,
  };
}
