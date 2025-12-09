import { expect, test } from "vitest";
import { parseOBF, stringifyOBF, validateOBF } from "../obf";
import type { OBFBoard } from "../schema";

const validBoard: OBFBoard = {
  format: "open-board-0.1",
  id: "test-board",
  buttons: [{ id: "btn-1", label: "Hello" }],
  grid: { rows: 1, columns: 1, order: [["btn-1"]] },
};

test("parseOBF handles UTF-8 BOM prefix", () => {
  const jsonWithBom = "\uFEFF" + JSON.stringify(validBoard);
  const result = parseOBF(jsonWithBom);

  expect(result.id).toBe("test-board");
});

test("parseOBF throws descriptive error for invalid JSON", () => {
  const malformedJson = '{ "format": "open-board-0.1", }';

  expect(() => parseOBF(malformedJson)).toThrow(
    /Invalid OBF: JSON parse failed/,
  );
});

test("validateOBF throws for missing required grid field", () => {
  const boardWithoutGrid = {
    format: "open-board-0.1",
    id: "test-board",
    buttons: [],
  };

  expect(() => validateOBF(boardWithoutGrid)).toThrow(/Invalid OBF/);
});

test("stringifyOBF and parseOBF round-trip preserves data", () => {
  const json = stringifyOBF(validBoard);
  const parsed = parseOBF(json);

  expect(parsed).toEqual(validBoard);
});
