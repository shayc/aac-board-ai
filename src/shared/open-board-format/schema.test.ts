import { describe, expect, test } from "vitest";
import lotsOfStuffExample from "./examples/lots_of_stuff.json";
import {
  OBFBoardSchema,
  OBFButtonSchema,
  OBFFormatVersionSchema,
  OBFGridSchema,
  OBFIDSchema,
  OBFImageSchema,
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
  test("accepts valid license with all fields", () => {
    const validLicense = {
      type: "CC-BY-SA",
      copyright_notice_url: "https://creativecommons.org/licenses/by-sa/4.0/",
      source_url: "https://example.com/source",
      author_name: "John Doe",
      author_url: "https://example.com/author",
      author_email: "john@example.com",
    };

    expect(OBFLicenseSchema.safeParse(validLicense).success).toBe(true);
  });

  test("accepts minimal valid license", () => {
    const minimalLicense = {
      type: "CC-BY",
    };

    expect(OBFLicenseSchema.safeParse(minimalLicense).success).toBe(true);
  });

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
  test("accepts valid media with URL", () => {
    const validMedia = {
      id: "img1",
      url: "https://example.com/image.png",
      content_type: "image/png",
    };

    expect(OBFMediaSchema.safeParse(validMedia).success).toBe(true);
  });

  test("accepts valid media with data URI", () => {
    const validMedia = {
      id: "img2",
      data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
      content_type: "image/png",
    };

    expect(OBFMediaSchema.safeParse(validMedia).success).toBe(true);
  });

  test("accepts valid media with path", () => {
    const validMedia = {
      id: "img3",
      path: "images/icon.png",
      content_type: "image/png",
    };

    expect(OBFMediaSchema.safeParse(validMedia).success).toBe(true);
  });

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

describe("OBFImageSchema", () => {
  test("accepts valid image with symbol info", () => {
    const validImage = {
      id: "img1",
      symbol: {
        set: "symbolstix",
        filename: "happy.png",
      },
      width: 300,
      height: 300,
      content_type: "image/png",
    };

    expect(OBFImageSchema.safeParse(validImage).success).toBe(true);
  });

  test("accepts valid image without symbol info", () => {
    const validImage = {
      id: "img2",
      url: "https://example.com/image.png",
      width: 200,
      height: 200,
      content_type: "image/png",
    };

    expect(OBFImageSchema.safeParse(validImage).success).toBe(true);
  });

  test("accepts image without dimensions", () => {
    const validImage = {
      id: "img3",
      path: "images/icon.png",
      content_type: "image/png",
    };

    expect(OBFImageSchema.safeParse(validImage).success).toBe(true);
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

describe("Integration: Real-world OBF Board", () => {
  test("validates complete board from lots_of_stuff.json example", () => {
    const result = OBFBoardSchema.safeParse(lotsOfStuffExample);

    expect(result.success).toBe(true);

    if (result.success) {
      // Verify key properties are parsed correctly
      expect(result.data.format).toBe("open-board-0.1");
      expect(result.data.id).toBe("lots_of_stuff");
      expect(result.data.locale).toBe("en");
      expect(result.data.buttons).toHaveLength(5);
      expect(result.data.images).toHaveLength(3);
      expect(result.data.sounds).toHaveLength(2);
      expect(result.data.grid.rows).toBe(2);
      expect(result.data.grid.columns).toBe(3);
    }
  });
});
