import { describe, expect, test } from "vitest";
import { isBoardFile } from "./board-file-types";

function namedFile(name: string): File {
  return new File([""], name);
}

describe("isBoardFile", () => {
  test("accepts .obf and .obz files", () => {
    expect(isBoardFile(namedFile("board.obf"))).toBe(true);
    expect(isBoardFile(namedFile("set.obz"))).toBe(true);
  });

  test("accepts .zip and .json files for untyped obz/obf exports", () => {
    expect(isBoardFile(namedFile("archive.zip"))).toBe(true);
    expect(isBoardFile(namedFile("board.json"))).toBe(true);
  });

  test("matches case-insensitively", () => {
    expect(isBoardFile(namedFile("BOARD.OBF"))).toBe(true);
  });

  test("rejects unrelated files", () => {
    expect(isBoardFile(namedFile("notes.txt"))).toBe(false);
    expect(isBoardFile(namedFile("image.png"))).toBe(false);
    expect(isBoardFile(namedFile("obfuscated"))).toBe(false);
  });
});
