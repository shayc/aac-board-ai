import { describe, expect, test } from "vitest";
import { hasBoardFileExtension } from "./board-file-formats";

describe("hasBoardFileExtension", () => {
  test("accepts .obf and .obz files", () => {
    expect(hasBoardFileExtension("board.obf")).toBe(true);
    expect(hasBoardFileExtension("set.obz")).toBe(true);
  });

  test("rejects generic .zip and .json files", () => {
    expect(hasBoardFileExtension("archive.zip")).toBe(false);
    expect(hasBoardFileExtension("board.json")).toBe(false);
  });

  test("matches case-insensitively", () => {
    expect(hasBoardFileExtension("BOARD.OBF")).toBe(true);
  });

  test("rejects unrelated files", () => {
    expect(hasBoardFileExtension("notes.txt")).toBe(false);
    expect(hasBoardFileExtension("image.png")).toBe(false);
    expect(hasBoardFileExtension("obfuscated")).toBe(false);
  });
});
