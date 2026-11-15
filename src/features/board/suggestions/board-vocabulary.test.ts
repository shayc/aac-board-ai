import type { Board, BoardButton } from "@features/library";
import { describe, expect, test } from "vitest";
import { boardVocabulary } from "./board-vocabulary";

function makeBoard(buttons: BoardButton[], order: (string | null)[][]): Board {
  return {
    id: "board",
    name: "Board",
    grid: { rows: order.length, columns: order[0]?.length ?? 0, order },
    buttons,
    translationsByLocale: new Map(),
  };
}

describe("boardVocabulary", () => {
  test("keeps word tiles in reading order, one per label", () => {
    const board = makeBoard(
      [
        { id: "want", label: "want", actions: [] },
        { id: "i", label: " I ", actions: [] },
        { id: "i-again", label: "I", actions: [] },
      ],
      [["i", null, "want"], ["i-again"]],
    );

    expect([...boardVocabulary(board).keys()]).toEqual(["I", "want"]);
    expect(boardVocabulary(board).get("I")?.id).toBe("i");
  });

  test("leaves out folders, action tiles, unlabelled and hidden tiles", () => {
    const board = makeBoard(
      [
        { id: "eat", label: "eat", actions: [] },
        { id: "food", label: "food", actions: [], linkedBoardId: "food" },
        { id: "clear", label: "clear", actions: [{ kind: "clear" }] },
        { id: "blank", label: " ", actions: [] },
        { id: "hidden", label: "hidden", actions: [] },
      ],
      [["eat", "food", "clear", "blank"]],
    );

    expect([...boardVocabulary(board).keys()]).toEqual(["eat"]);
  });
});
