import { describe, expect, test } from "vitest";
import { hasBoardFileExtension } from "./board-file-formats";

describe("hasBoardFileExtension", () => {
  test("accepts .obf and .obz files", () => {
    expect(hasBoardFileExtension("board.obf")).toBe(true);
    expect(hasBoardFileExtension("set.obz")).toBe(true);
  });

  test("accepts .zip and .json files for untyped obz/obf exports", () => {
    expect(hasBoardFileExtension("archive.zip")).toBe(true);
    expect(hasBoardFileExtension("board.json")).toBe(true);
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
