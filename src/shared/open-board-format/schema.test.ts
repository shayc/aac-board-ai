import { expect, test } from "vitest";
import { OBFBoardSchema, OBFGridSchema, OBFManifestSchema } from "./schema";

test("OBFBoardSchema requires format, buttons, and grid", () => {
  const missingFormat = {
    id: "1",
    buttons: [],
    grid: { rows: 1, columns: 1, order: [[]] },
  };
  const missingButtons = {
    format: "open-board-0.1",
    id: "1",
    grid: { rows: 1, columns: 1, order: [[]] },
  };
  const missingGrid = { format: "open-board-0.1", id: "1", buttons: [] };

  expect(OBFBoardSchema.safeParse(missingFormat).success).toBe(false);
  expect(OBFBoardSchema.safeParse(missingButtons).success).toBe(false);
  expect(OBFBoardSchema.safeParse(missingGrid).success).toBe(false);
});

test("OBFBoardSchema rejects invalid format version pattern", () => {
  const invalidFormat = {
    format: "invalid-format",
    id: "1",
    buttons: [],
    grid: { rows: 1, columns: 1, order: [[]] },
  };

  const result = OBFBoardSchema.safeParse(invalidFormat);

  expect(result.success).toBe(false);
});

test("OBFGridSchema enforces positive integer rows and columns", () => {
  const zeroRows = { rows: 0, columns: 1, order: [] };
  const negativeColumns = { rows: 1, columns: -1, order: [[]] };
  const validGrid = {
    rows: 2,
    columns: 3,
    order: [
      ["a", "b", "c"],
      ["d", null, "e"],
    ],
  };

  expect(OBFGridSchema.safeParse(zeroRows).success).toBe(false);
  expect(OBFGridSchema.safeParse(negativeColumns).success).toBe(false);
  expect(OBFGridSchema.safeParse(validGrid).success).toBe(true);
});

test("OBFManifestSchema validates required paths structure", () => {
  const validManifest = {
    format: "open-board-0.1",
    root: "boards/main.obf",
    paths: { boards: { main: "boards/main.obf" }, images: {} },
  };
  const missingPaths = { format: "open-board-0.1", root: "boards/main.obf" };

  expect(OBFManifestSchema.safeParse(validManifest).success).toBe(true);
  expect(OBFManifestSchema.safeParse(missingPaths).success).toBe(false);
});
