import { describe, expect, test } from "vitest";
import type { Board, BoardButton } from "../types";
import { getBoardWords } from "./get-board-words";

function makeBoard(buttons: BoardButton[]): Board {
  return {
    id: "test-board",
    grid: { rows: 1, columns: buttons.length },
    buttons,
  };
}

describe("getBoardWords", () => {
  test("collects the labels of word tiles", () => {
    const board = makeBoard([
      { id: "b1", label: "eat" },
      { id: "b2", label: "drink" },
      { id: "b3", label: "more" },
    ]);

    expect(getBoardWords(board)).toEqual(["eat", "drink", "more"]);
  });

  test("excludes folders and action tiles", () => {
    const board = makeBoard([
      { id: "b1", label: "food", loadBoard: { id: "food-board" } },
      { id: "b2", label: "clear", actions: [{ kind: "clear" }] },
      { id: "b3", label: "eat" },
    ]);

    expect(getBoardWords(board)).toEqual(["eat"]);
  });

  test("ignores buttons with a blank label", () => {
    const board = makeBoard([
      { id: "b1", label: "   " },
      { id: "b2" },
      { id: "b3", label: "help" },
    ]);

    expect(getBoardWords(board)).toEqual(["help"]);
  });

  test("trims labels and dedupes case-insensitively, keeping the first casing", () => {
    const board = makeBoard([
      { id: "b1", label: " Eat " },
      { id: "b2", label: "eat" },
      { id: "b3", label: "EAT" },
    ]);

    expect(getBoardWords(board)).toEqual(["Eat"]);
  });

  test("caps the result at 112 words", () => {
    const board = makeBoard(
      Array.from({ length: 150 }, (_, i) => ({
        id: `b${i}`,
        label: `word${i}`,
      })),
    );

    const words = getBoardWords(board);
    expect(words).toHaveLength(112);
    expect(words[0]).toBe("word0");
    expect(words[111]).toBe("word111");
  });
});
