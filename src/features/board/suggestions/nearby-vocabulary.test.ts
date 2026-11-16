import type { Board, BoardButton } from "@features/library";
import { describe, expect, test } from "vitest";
import { nearbyVocabulary } from "./nearby-vocabulary";

function makeBoard(
  id: string,
  buttons: BoardButton[],
  order: (string | null)[][],
): Board {
  return {
    id,
    name: id,
    grid: { rows: order.length, columns: order[0]?.length ?? 0, order },
    buttons,
    translationsByLocale: new Map(),
  };
}

describe("nearbyVocabulary", () => {
  test("keeps word tiles in reading order, one per label", () => {
    const board = makeBoard(
      "main",
      [
        { id: "want", label: "want", actions: [] },
        { id: "i", label: " I ", actions: [] },
        { id: "i-again", label: "I", actions: [] },
      ],
      [["i", null, "want"], ["i-again"]],
    );

    const vocabulary = nearbyVocabulary(board, []);

    expect([...vocabulary.keys()]).toEqual(["I", "want"]);
    expect(vocabulary.get("I")?.button.id).toBe("i");
  });

  test("leaves out folders, action tiles, unlabelled and hidden tiles", () => {
    const board = makeBoard(
      "main",
      [
        { id: "eat", label: "eat", actions: [] },
        { id: "food", label: "food", actions: [], linkedBoardId: "food" },
        { id: "clear", label: "clear", actions: [{ kind: "clear" }] },
        { id: "blank", label: " ", actions: [] },
        { id: "hidden", label: "hidden", actions: [] },
      ],
      [["eat", "food", "clear", "blank"]],
    );

    expect([...nearbyVocabulary(board, []).keys()]).toEqual(["eat"]);
  });

  test("adds the nearby boards' words after the board in view, which keeps a shared label", () => {
    const board = makeBoard(
      "main",
      [
        { id: "want", label: "want", actions: [] },
        { id: "eat-folder", label: "eat", actions: [], linkedBoardId: "eat" },
      ],
      [["want", "eat-folder"]],
    );
    const eatBoard = makeBoard(
      "eat",
      [
        { id: "eat", label: "eat", actions: [] },
        { id: "want-too", label: "want", actions: [] },
      ],
      [["eat", "want-too"]],
    );

    const vocabulary = nearbyVocabulary(board, [eatBoard]);

    expect([...vocabulary.keys()]).toEqual(["want", "eat"]);
    expect(vocabulary.get("eat")).toMatchObject({
      boardId: "eat",
      button: { id: "eat" },
    });
    expect(vocabulary.get("want")?.boardId).toBe("main");
  });
});
