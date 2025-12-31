import { describe, expect, test } from "vitest";
import lotsOfStuffExample from "./examples/lots_of_stuff.json";
import {
  OBFBoardSchema,
  OBFButtonActionSchema,
  OBFButtonSchema,
  OBFFormatVersionSchema,
  OBFGridSchema,
  OBFIDSchema,
  OBFImageSchema,
  OBFLicenseSchema,
  OBFManifestSchema,
  OBFMediaSchema,
  OBFSpecialtyActionSchema,
  OBFSpellingActionSchema,
  OBFSymbolInfoSchema,
} from "./schema";

describe("OBFIDSchema", () => {
  test("coerces numbers to strings", () => {
    expect(OBFIDSchema.parse(123)).toBe("123");
    expect(OBFIDSchema.parse("abc")).toBe("abc");
    expect(OBFIDSchema.parse(0)).toBe("0");
  });

  test("rejects empty string", () => {
    expect(OBFIDSchema.safeParse("").success).toBe(false);
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

  test("rejects empty suffix after open-board-", () => {
    expect(OBFFormatVersionSchema.safeParse("open-board-").success).toBe(false);
  });
});

describe("OBFSpellingActionSchema", () => {
  test("accepts valid spelling actions with + prefix", () => {
    expect(OBFSpellingActionSchema.safeParse("+hello").success).toBe(true);
    expect(OBFSpellingActionSchema.safeParse("+a").success).toBe(true);
    expect(OBFSpellingActionSchema.safeParse("+Hello World").success).toBe(
      true,
    );
  });

  test("rejects actions without + prefix", () => {
    expect(OBFSpellingActionSchema.safeParse("hello").success).toBe(false);
    expect(OBFSpellingActionSchema.safeParse(":space").success).toBe(false);
  });

  test("rejects empty + action", () => {
    expect(OBFSpellingActionSchema.safeParse("+").success).toBe(false);
  });
});

describe("OBFSpecialtyActionSchema", () => {
  test.each([":space", ":clear", ":home", ":speak", ":backspace"])(
    "accepts %s",
    (action) => {
      expect(OBFSpecialtyActionSchema.safeParse(action).success).toBe(true);
    },
  );

  test.each([":ext_custom", ":ext_my_action"])(
    "accepts custom extension %s",
    (action) => {
      expect(OBFSpecialtyActionSchema.safeParse(action).success).toBe(true);
    },
  );

  test.each([":invalid", ":ext_"])("rejects invalid action %s", (action) => {
    expect(OBFSpecialtyActionSchema.safeParse(action).success).toBe(false);
  });
});

describe("OBFButtonActionSchema", () => {
  test("accepts spelling actions with + prefix", () => {
    expect(OBFButtonActionSchema.safeParse("+hello").success).toBe(true);
    expect(OBFButtonActionSchema.safeParse("+a").success).toBe(true);
  });

  test("accepts specialty actions", () => {
    expect(OBFButtonActionSchema.safeParse(":space").success).toBe(true);
    expect(OBFButtonActionSchema.safeParse(":clear").success).toBe(true);
  });

  test("accepts custom :ext_ actions", () => {
    expect(OBFButtonActionSchema.safeParse(":ext_custom").success).toBe(true);
  });

  test("rejects invalid actions", () => {
    expect(OBFButtonActionSchema.safeParse(":invalid").success).toBe(false);
    expect(OBFButtonActionSchema.safeParse("hello").success).toBe(false);
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

  test("rejects missing type field", () => {
    const missingType = {
      author_name: "John Doe",
    };

    expect(OBFLicenseSchema.safeParse(missingType).success).toBe(false);
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

  test("accepts valid media with data_url", () => {
    const validMedia = {
      id: "img4",
      data_url: "https://example.com/api/image",
      content_type: "image/png",
    };

    expect(OBFMediaSchema.safeParse(validMedia).success).toBe(true);
  });

  test("accepts media with only id (reference is optional)", () => {
    const minimalMedia = { id: "x" };

    expect(OBFMediaSchema.safeParse(minimalMedia).success).toBe(true);
  });

  test("coerces numeric id to string in nested object", () => {
    const result = OBFMediaSchema.parse({ id: 123 });

    expect(result.id).toBe("123");
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
  test("rejects missing id", () => {
    const missingId = { label: "Hello" };

    expect(OBFButtonSchema.safeParse(missingId).success).toBe(false);
  });

  test("accepts button with valid action", () => {
    const withSpellingAction = { id: "1", action: "+hello" };
    const withSpecialtyAction = { id: "2", action: ":space" };
    const withExtAction = { id: "3", action: ":ext_custom" };

    expect(OBFButtonSchema.safeParse(withSpellingAction).success).toBe(true);
    expect(OBFButtonSchema.safeParse(withSpecialtyAction).success).toBe(true);
    expect(OBFButtonSchema.safeParse(withExtAction).success).toBe(true);
  });

  test("rejects button with invalid action", () => {
    const invalidAction = { id: "1", action: ":invalid" };
    const plainString = { id: "1", action: "hello" };

    expect(OBFButtonSchema.safeParse(invalidAction).success).toBe(false);
    expect(OBFButtonSchema.safeParse(plainString).success).toBe(false);
  });

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

  test("accepts button with actions array and load_board, coerces nested ID", () => {
    const buttonWithActionsAndLoadBoard = {
      id: "nav-btn",
      actions: [":clear", "+Hello", ":speak"],
      load_board: { id: 1, path: "boards/home.obf" },
    };

    const result = OBFButtonSchema.safeParse(buttonWithActionsAndLoadBoard);

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.actions).toHaveLength(3);
      expect(result.data.load_board?.id).toBe("1");
      expect(result.data.load_board?.path).toBe("boards/home.obf");
    }
  });

  test("rejects invalid action in actions array", () => {
    const invalidActionsArray = {
      id: "1",
      actions: [":clear", "invalid-action", ":speak"],
    };

    expect(OBFButtonSchema.safeParse(invalidActionsArray).success).toBe(false);
  });

  test("rejects invalid URL in load_board", () => {
    const invalidLoadBoardUrl = {
      id: "1",
      load_board: {
        url: "not-a-valid-url",
      },
    };

    expect(OBFButtonSchema.safeParse(invalidLoadBoardUrl).success).toBe(false);
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

  test("coerces numeric IDs in order to strings", () => {
    const gridWithNumericIds = {
      rows: 2,
      columns: 2,
      order: [
        [1, 2],
        [3, null],
      ],
    };

    const result = OBFGridSchema.safeParse(gridWithNumericIds);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.order[0][0]).toBe("1");
      expect(result.data.order[0][1]).toBe("2");
      expect(result.data.order[1][0]).toBe("3");
      expect(result.data.order[1][1]).toBeNull();
    }
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

  test("rejects order length mismatch with rows", () => {
    const mismatchedRows = {
      rows: 3,
      columns: 2,
      order: [
        ["a", "b"],
        ["c", "d"],
      ],
    };

    expect(OBFGridSchema.safeParse(mismatchedRows).success).toBe(false);
  });

  test("rejects row length mismatch with columns", () => {
    const mismatchedColumns = {
      rows: 2,
      columns: 3,
      order: [
        ["a", "b"],
        ["c", "d", "e"],
      ],
    };

    expect(OBFGridSchema.safeParse(mismatchedColumns).success).toBe(false);
  });
});

describe("OBFBoardSchema", () => {
  test("accepts minimal valid board", () => {
    const minimalBoard = {
      format: "open-board-0.1",
      id: "board-1",
      buttons: [],
      grid: { rows: 1, columns: 1, order: [[null]] },
    };

    expect(OBFBoardSchema.safeParse(minimalBoard).success).toBe(true);
  });

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

  test("rejects missing format field", () => {
    const missingFormat = {
      root: "boards/main.obf",
      paths: { boards: { main: "boards/main.obf" }, images: {} },
    };

    expect(OBFManifestSchema.safeParse(missingFormat).success).toBe(false);
  });

  test("rejects missing root field", () => {
    const missingRoot = {
      format: "open-board-0.1",
      paths: { boards: { main: "boards/main.obf" }, images: {} },
    };

    expect(OBFManifestSchema.safeParse(missingRoot).success).toBe(false);
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

  test("requires images in paths", () => {
    const missingImages = {
      format: "open-board-0.1",
      root: "boards/main.obf",
      paths: { boards: { main: "boards/main.obf" } },
    };

    expect(OBFManifestSchema.safeParse(missingImages).success).toBe(false);
  });

  test("accepts manifest without sounds (optional)", () => {
    const noSounds = {
      format: "open-board-0.1",
      root: "boards/main.obf",
      paths: {
        boards: { main: "boards/main.obf" },
        images: { icon: "images/icon.png" },
      },
    };

    expect(OBFManifestSchema.safeParse(noSounds).success).toBe(true);
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
