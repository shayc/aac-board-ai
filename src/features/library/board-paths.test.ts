import { describe, expect, test } from "vitest";
import { boardPath, boardSetIdFromPath } from "./board-paths";

describe("boardSetIdFromPath", () => {
  test.each(["food", "my board", "café", "50% core"])(
    "reads %j back from its board path",
    (boardSetId) => {
      const path = boardPath({ boardSetId, boardId: "home" });

      expect(boardSetIdFromPath(path)).toBe(boardSetId);
    },
  );

  test("reads the ID from a board set path without a board", () => {
    expect(boardSetIdFromPath("/sets/my%20board")).toBe("my board");
  });

  test("reads a malformed encoding as written, as the router does", () => {
    expect(boardSetIdFromPath("/sets/%E0%A4%A")).toBe("%E0%A4%A");
  });

  test("returns undefined outside a board set", () => {
    expect(boardSetIdFromPath("/")).toBeUndefined();
  });
});
