import { describe, expect, test } from "vitest";
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

describe("OBFIDSchema", () => {
  test("coerces numbers to strings", () => {
    expect(OBFIDSchema.parse(123)).toBe("123");
    expect(OBFIDSchema.parse("abc")).toBe("abc");
    expect(OBFIDSchema.parse(0)).toBe("0");
  });
});

describe("OBFFormatVersionSchema", () => {
  test("accepts valid open-board- prefix", () => {
    expect(OBFFormatVersionSchema.safeParse("open-board-0.1").success).toBe(
      true,
    );
    expect(OBFFormatVersionSchema.safeParse("open-board-1.0").success).toBe(
      true,
    );
  });

  test("rejects invalid format patterns", () => {
    expect(OBFFormatVersionSchema.safeParse("invalid-format").success).toBe(
      false,
    );
    expect(OBFFormatVersionSchema.safeParse("board-0.1").success).toBe(false);
  });
});

describe("OBFSpecialtyActionSchema", () => {
  test("accepts valid specialty actions", () => {
    expect(OBFSpecialtyActionSchema.safeParse(":space").success).toBe(true);
    expect(OBFSpecialtyActionSchema.safeParse(":clear").success).toBe(true);
    expect(OBFSpecialtyActionSchema.safeParse(":home").success).toBe(true);
    expect(OBFSpecialtyActionSchema.safeParse(":speak").success).toBe(true);
    expect(OBFSpecialtyActionSchema.safeParse(":backspace").success).toBe(true);
  });

  test("rejects invalid actions", () => {
    expect(OBFSpecialtyActionSchema.safeParse(":invalid").success).toBe(false);
  });
});

describe("OBFLicenseSchema", () => {
  test("rejects invalid URLs", () => {
    const invalidUrl = {
      type: "CC-BY",
      copyright_notice_url: "not-a-url",
    };

    expect(OBFLicenseSchema.safeParse(invalidUrl).success).toBe(false);
  });

  test("rejects invalid emails", () => {
    const invalidEmail = {
      type: "CC-BY",
      author_email: "not-an-email",
    };

    expect(OBFLicenseSchema.safeParse(invalidEmail).success).toBe(false);
  });
});

describe("OBFMediaSchema", () => {
  test("rejects invalid URLs", () => {
    const invalidUrl = { id: "1", url: "not-a-url" };
    const invalidDataUrl = { id: "1", data_url: "invalid" };

    expect(OBFMediaSchema.safeParse(invalidUrl).success).toBe(false);
    expect(OBFMediaSchema.safeParse(invalidDataUrl).success).toBe(false);
  });
});

describe("OBFSymbolInfoSchema", () => {
  test("requires both set and filename", () => {
    const valid = { set: "symbolstix", filename: "happy.png" };
    const missingSet = { filename: "happy.png" };
    const missingFilename = { set: "symbolstix" };

    expect(OBFSymbolInfoSchema.safeParse(valid).success).toBe(true);
    expect(OBFSymbolInfoSchema.safeParse(missingSet).success).toBe(false);
    expect(OBFSymbolInfoSchema.safeParse(missingFilename).success).toBe(false);
  });
});

describe("OBFButtonSchema", () => {
  test("accepts valid positioning bounds", () => {
    const validButton = {
      id: "1",
      top: 0.5,
      left: 0.25,
      width: 0.1,
      height: 0.15,
    };

    expect(OBFButtonSchema.safeParse(validButton).success).toBe(true);
  });

  test("rejects out-of-bounds top", () => {
    const outOfBoundsTop = {
      id: "1",
      top: 1.5,
      left: 0,
      width: 0.1,
      height: 0.1,
    };

    expect(OBFButtonSchema.safeParse(outOfBoundsTop).success).toBe(false);
  });

  test("rejects negative left", () => {
    const outOfBoundsLeft = {
      id: "1",
      top: 0,
      left: -0.1,
      width: 0.1,
      height: 0.1,
    };

    expect(OBFButtonSchema.safeParse(outOfBoundsLeft).success).toBe(false);
  });

  test("rejects out-of-bounds width", () => {
    const outOfBoundsWidth = {
      id: "1",
      top: 0,
      left: 0,
      width: 1.5,
      height: 0.1,
    };

    expect(OBFButtonSchema.safeParse(outOfBoundsWidth).success).toBe(false);
  });
});

describe("OBFGridSchema", () => {
  test("accepts valid grid with positive integers", () => {
    const validGrid = {
      rows: 2,
      columns: 3,
      order: [
        ["a", "b", "c"],
        ["d", null, "e"],
      ],
    };

    expect(OBFGridSchema.safeParse(validGrid).success).toBe(true);
  });

  test("rejects zero rows", () => {
    const zeroRows = { rows: 0, columns: 1, order: [] };

    expect(OBFGridSchema.safeParse(zeroRows).success).toBe(false);
  });

  test("rejects negative columns", () => {
    const negativeColumns = { rows: 1, columns: -1, order: [[]] };

    expect(OBFGridSchema.safeParse(negativeColumns).success).toBe(false);
  });

  test("rejects float rows", () => {
    const floatRows = { rows: 2.5, columns: 3, order: [[]] };

    expect(OBFGridSchema.safeParse(floatRows).success).toBe(false);
  });
});

describe("OBFBoardSchema", () => {
  test("requires format field", () => {
    const missingFormat = {
      id: "1",
      buttons: [],
      grid: { rows: 1, columns: 1, order: [[]] },
    };

    expect(OBFBoardSchema.safeParse(missingFormat).success).toBe(false);
  });

  test("requires buttons field", () => {
    const missingButtons = {
      format: "open-board-0.1",
      id: "1",
      grid: { rows: 1, columns: 1, order: [[]] },
    };

    expect(OBFBoardSchema.safeParse(missingButtons).success).toBe(false);
  });

  test("requires grid field", () => {
    const missingGrid = { format: "open-board-0.1", id: "1", buttons: [] };

    expect(OBFBoardSchema.safeParse(missingGrid).success).toBe(false);
  });

  test("rejects invalid format version pattern", () => {
    const invalidFormat = {
      format: "invalid-format",
      id: "1",
      buttons: [],
      grid: { rows: 1, columns: 1, order: [[]] },
    };

    expect(OBFBoardSchema.safeParse(invalidFormat).success).toBe(false);
  });
});

describe("OBFManifestSchema", () => {
  test("accepts valid manifest structure", () => {
    const validManifest = {
      format: "open-board-0.1",
      root: "boards/main.obf",
      paths: { boards: { main: "boards/main.obf" }, images: {} },
    };

    expect(OBFManifestSchema.safeParse(validManifest).success).toBe(true);
  });

  test("requires paths field", () => {
    const missingPaths = { format: "open-board-0.1", root: "boards/main.obf" };

    expect(OBFManifestSchema.safeParse(missingPaths).success).toBe(false);
  });

  test("requires boards in paths", () => {
    const missingBoards = {
      format: "open-board-0.1",
      root: "boards/main.obf",
      paths: { images: {} },
    };

    expect(OBFManifestSchema.safeParse(missingBoards).success).toBe(false);
  });
});
