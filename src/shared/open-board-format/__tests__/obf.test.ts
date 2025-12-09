import { describe, expect, test } from "vitest";
import { loadOBF, parseOBF, stringifyOBF, validateOBF } from "../obf";
import type { OBFBoard } from "../schema";

const validBoard: OBFBoard = {
  format: "open-board-0.1",
  id: "test-board",
  buttons: [{ id: "btn-1", label: "Hello" }],
  grid: { rows: 1, columns: 1, order: [["btn-1"]] },
};

describe("parseOBF", () => {
  test("parses valid JSON board", () => {
    const json = JSON.stringify(validBoard);
    const result = parseOBF(json);

    expect(result).toEqual(validBoard);
  });

  test("handles UTF-8 BOM prefix", () => {
    const jsonWithBom = "\uFEFF" + JSON.stringify(validBoard);
    const result = parseOBF(jsonWithBom);

    expect(result.id).toBe("test-board");
  });

  test("throws descriptive error for invalid JSON", () => {
    const malformedJson = '{ "format": "open-board-0.1", }';

    expect(() => parseOBF(malformedJson)).toThrow(
      /Invalid OBF: JSON parse failed/,
    );
  });
});

describe("validateOBF", () => {
  test("accepts valid board structure", () => {
    expect(() => validateOBF(validBoard)).not.toThrow();
  });

  test("throws for missing required grid field", () => {
    const boardWithoutGrid = {
      format: "open-board-0.1",
      id: "test-board",
      buttons: [],
    };

    expect(() => validateOBF(boardWithoutGrid)).toThrow(/Invalid OBF/);
  });
});

describe("loadOBF", () => {
  test("loads board from File object", async () => {
    const json = JSON.stringify(validBoard);
    const file = new File([json], "test.obf", { type: "application/json" });

    const result = await loadOBF(file);

    expect(result).toEqual(validBoard);
  });

  test("handles UTF-8 BOM in File", async () => {
    const jsonWithBom = "\ufeff" + JSON.stringify(validBoard);
    const file = new File([jsonWithBom], "test.obf", {
      type: "application/json",
    });

    const result = await loadOBF(file);

    expect(result.id).toBe("test-board");
  });
});

describe("Integration: parseOBF and stringifyOBF", () => {
  test("round-trip preserves data", () => {
    const json = stringifyOBF(validBoard);
    const parsed = parseOBF(json);

    expect(parsed).toEqual(validBoard);
  });
});
