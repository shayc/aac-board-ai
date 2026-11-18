import { describe, expect, test } from "vitest";
import type { Board } from "../board-types";
import { collectBoardStrings } from "./collect-board-strings";

const mockBoard: Board = {
  id: "board-1",
  name: "My Board",
  grid: { order: [["hello", "more"]] },
  buttons: [
    {
      id: "btn-1",
      label: "Hello",
      vocalization: "Hello there",
      actions: [],
    },
    {
      id: "btn-2",
      label: "",
      vocalization: undefined,
      actions: [],
    },
  ],
  locale: "en-US",
  translationsByLocale: new Map(),
};

describe("collectBoardStrings", () => {
  test("collects each unique nonblank name, label, and vocalization", () => {
    const strings = collectBoardStrings(mockBoard);

    expect(strings.size).toBe(3);
    expect(strings.has("My Board")).toBe(true);
    expect(strings.has("Hello")).toBe(true);
    expect(strings.has("Hello there")).toBe(true);
  });
});
