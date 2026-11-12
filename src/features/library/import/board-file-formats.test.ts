import { describe, expect, test } from "vitest";
import { hasBoardFileExtension } from "./board-file-formats";

function namedFile(name: string): File {
  return new File([""], name);
}

describe("hasBoardFileExtension", () => {
  test("accepts .obf and .obz files", () => {
    expect(hasBoardFileExtension(namedFile("board.obf"))).toBe(true);
    expect(hasBoardFileExtension(namedFile("set.obz"))).toBe(true);
  });

  test("accepts .zip and .json files for untyped obz/obf exports", () => {
    expect(hasBoardFileExtension(namedFile("archive.zip"))).toBe(true);
    expect(hasBoardFileExtension(namedFile("board.json"))).toBe(true);
  });

  test("matches case-insensitively", () => {
    expect(hasBoardFileExtension(namedFile("BOARD.OBF"))).toBe(true);
  });

  test("rejects unrelated files", () => {
    expect(hasBoardFileExtension(namedFile("notes.txt"))).toBe(false);
    expect(hasBoardFileExtension(namedFile("image.png"))).toBe(false);
    expect(hasBoardFileExtension(namedFile("obfuscated"))).toBe(false);
  });
});
