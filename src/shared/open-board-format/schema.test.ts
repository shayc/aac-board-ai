import { expect, test } from "vitest";
import {
  OBFBoardSchema,
  OBFButtonSchema,
  OBFFormatVersionSchema,
  OBFGridSchema,
  OBFIDSchema,
  OBFLicenseSchema,
  OBFManifestSchema,
  OBFMediaSchema,
  OBFSpecialtyActionSchema,
  OBFSymbolInfoSchema,
} from "./schema";

// ===== OBFIDSchema =====
test("OBFIDSchema coerces numbers to strings", () => {
  expect(OBFIDSchema.parse(123)).toBe("123");
  expect(OBFIDSchema.parse("abc")).toBe("abc");
  expect(OBFIDSchema.parse(0)).toBe("0");
});

// ===== OBFFormatVersionSchema =====
test("OBFFormatVersionSchema requires open-board- prefix", () => {
  expect(OBFFormatVersionSchema.safeParse("open-board-0.1").success).toBe(true);
  expect(OBFFormatVersionSchema.safeParse("open-board-1.0").success).toBe(true);
  expect(OBFFormatVersionSchema.safeParse("invalid-format").success).toBe(
    false,
  );
  expect(OBFFormatVersionSchema.safeParse("board-0.1").success).toBe(false);
});

// ===== OBFSpecialtyActionSchema =====
test("OBFSpecialtyActionSchema accepts valid specialty actions", () => {
  expect(OBFSpecialtyActionSchema.safeParse(":space").success).toBe(true);
  expect(OBFSpecialtyActionSchema.safeParse(":clear").success).toBe(true);
  expect(OBFSpecialtyActionSchema.safeParse(":home").success).toBe(true);
  expect(OBFSpecialtyActionSchema.safeParse(":speak").success).toBe(true);
  expect(OBFSpecialtyActionSchema.safeParse(":backspace").success).toBe(true);
  expect(OBFSpecialtyActionSchema.safeParse(":invalid").success).toBe(false);
});

// ===== OBFLicenseSchema =====

test("OBFLicenseSchema validates URL fields", () => {
  const invalidUrl = {
    type: "CC-BY",
    copyright_notice_url: "not-a-url",
  };

  expect(OBFLicenseSchema.safeParse(invalidUrl).success).toBe(false);
});

test("OBFLicenseSchema validates email field", () => {
  const invalidEmail = {
    type: "CC-BY",
    author_email: "not-an-email",
  };

  expect(OBFLicenseSchema.safeParse(invalidEmail).success).toBe(false);
});

test("OBFMediaSchema validates URL formats", () => {
  const invalidUrl = { id: "1", url: "not-a-url" };
  const invalidDataUrl = { id: "1", data_url: "invalid" };

  expect(OBFMediaSchema.safeParse(invalidUrl).success).toBe(false);
  expect(OBFMediaSchema.safeParse(invalidDataUrl).success).toBe(false);
});

// ===== OBFSymbolInfoSchema =====
test("OBFSymbolInfoSchema requires set and filename", () => {
  const valid = { set: "symbolstix", filename: "happy.png" };
  const missingSet = { filename: "happy.png" };
  const missingFilename = { set: "symbolstix" };

  expect(OBFSymbolInfoSchema.safeParse(valid).success).toBe(true);
  expect(OBFSymbolInfoSchema.safeParse(missingSet).success).toBe(false);
  expect(OBFSymbolInfoSchema.safeParse(missingFilename).success).toBe(false);
});

// ===== OBFButtonSchema =====
test("OBFButtonSchema validates absolute positioning bounds", () => {
  const validButton = {
    id: "1",
    top: 0.5,
    left: 0.25,
    width: 0.1,
    height: 0.15,
  };
  const outOfBoundsTop = {
    id: "1",
    top: 1.5,
    left: 0,
    width: 0.1,
    height: 0.1,
  };
  const outOfBoundsLeft = {
    id: "1",
    top: 0,
    left: -0.1,
    width: 0.1,
    height: 0.1,
  };
  const outOfBoundsWidth = {
    id: "1",
    top: 0,
    left: 0,
    width: 1.5,
    height: 0.1,
  };

  expect(OBFButtonSchema.safeParse(validButton).success).toBe(true);
  expect(OBFButtonSchema.safeParse(outOfBoundsTop).success).toBe(false);
  expect(OBFButtonSchema.safeParse(outOfBoundsLeft).success).toBe(false);
  expect(OBFButtonSchema.safeParse(outOfBoundsWidth).success).toBe(false);
});

// ===== OBFGridSchema =====
test("OBFGridSchema enforces positive integer rows and columns", () => {
  const zeroRows = { rows: 0, columns: 1, order: [] };
  const negativeColumns = { rows: 1, columns: -1, order: [[]] };
  const floatRows = { rows: 2.5, columns: 3, order: [[]] };
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
  expect(OBFGridSchema.safeParse(floatRows).success).toBe(false);
  expect(OBFGridSchema.safeParse(validGrid).success).toBe(true);
});

// ===== OBFBoardSchema =====
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

  expect(OBFBoardSchema.safeParse(invalidFormat).success).toBe(false);
});

// ===== OBFManifestSchema =====
test("OBFManifestSchema validates required paths structure", () => {
  const validManifest = {
    format: "open-board-0.1",
    root: "boards/main.obf",
    paths: { boards: { main: "boards/main.obf" }, images: {} },
  };
  const missingPaths = { format: "open-board-0.1", root: "boards/main.obf" };
  const missingBoards = {
    format: "open-board-0.1",
    root: "boards/main.obf",
    paths: { images: {} },
  };

  expect(OBFManifestSchema.safeParse(validManifest).success).toBe(true);
  expect(OBFManifestSchema.safeParse(missingPaths).success).toBe(false);
  expect(OBFManifestSchema.safeParse(missingBoards).success).toBe(false);
});
