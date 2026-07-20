import type { Board, BoardSummary } from "@features/board";
import { describe, expect, test } from "vitest";
import { resolveBoardSelectorOptions } from "./resolve-board-selector-options";

const boards: BoardSummary[] = [
  { boardId: "food", name: "Food" },
  { boardId: "root", name: "Home" },
];

function createBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: "root",
    name: "Home",
    grid: { rows: 1, columns: 1 },
    buttons: [],
    ...overrides,
  };
}

describe("resolveBoardSelectorOptions", () => {
  test("uses the current board name from the same translated route snapshot", () => {
    const options = resolveBoardSelectorOptions(
      boards,
      createBoard({ name: "Inicio" }),
      "es",
    );

    expect(options).toEqual([
      { boardId: "food", name: "Food" },
      { boardId: "root", name: "Inicio" },
    ]);
  });

  test("preserves summaries when the current board has no name", () => {
    expect(
      resolveBoardSelectorOptions(
        boards,
        createBoard({ name: undefined }),
        "en",
      ),
    ).toBe(boards);
  });

  test("resorts options after replacing the current name", () => {
    const options = resolveBoardSelectorOptions(
      boards,
      createBoard({ name: "Abode" }),
      "en",
    );

    expect(options.map((board) => board.name)).toEqual(["Abode", "Food"]);
  });
});
