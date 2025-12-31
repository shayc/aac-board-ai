import { describe, expect, test } from "vitest";
import { createOBZ, extractOBZ, loadOBZ, parseManifest } from "./obz";
import { zip } from "./zip";
import type { OBFBoard } from "./schema";

describe("parseManifest", () => {
  test("parses valid manifest", () => {
    const validManifest = JSON.stringify({
      format: "open-board-0.1",
      root: "boards/test.obf",
      paths: { boards: { test: "boards/test.obf" }, images: {} },
    });

    const manifest = parseManifest(validManifest);

    expect(manifest.format).toBe("open-board-0.1");
    expect(manifest.root).toBe("boards/test.obf");
    expect(manifest.paths.boards.test).toBe("boards/test.obf");
  });

  test("throws for invalid manifest format", () => {
    const invalidManifest = JSON.stringify({
      format: "wrong-format",
      root: "boards/test.obf",
      paths: { boards: { test: "boards/test.obf" }, images: {} },
    });

    expect(() => parseManifest(invalidManifest)).toThrow(/Invalid manifest/);
  });
});

describe("extractOBZ", () => {
  test("throws for non-ZIP input", async () => {
    const notZip = new ArrayBuffer(10);

    await expect(extractOBZ(notZip)).rejects.toThrow(
      "Invalid OBZ: not a ZIP file",
    );
  });

  test("throws for missing manifest.json", async () => {
    const filesWithoutManifest = new Map([
      ["boards/test.obf", new TextEncoder().encode("{}")],
    ]);
    const zipBuffer = await zip(filesWithoutManifest);

    await expect(extractOBZ(zipBuffer.buffer as ArrayBuffer)).rejects.toThrow(
      "Invalid OBZ: missing manifest.json",
    );
  });

  test("extracts valid OBZ archive", async () => {
    const board: OBFBoard = {
      format: "open-board-0.1",
      id: "test",
      buttons: [{ id: "btn-1", label: "Hello" }],
      grid: { rows: 1, columns: 1, order: [["btn-1"]] },
    };

    const obzBlob = await createOBZ([board], "test");
    const result = await extractOBZ(await obzBlob.arrayBuffer());

    expect(result.manifest.root).toBe("boards/test.obf");
    expect(result.files.has("manifest.json")).toBe(true);
    expect(result.files.has("boards/test.obf")).toBe(true);

    const extractedBoard = result.boards.get("test");
    expect(extractedBoard).toMatchObject({
      id: "test",
      buttons: [{ id: "btn-1", label: "Hello" }],
      grid: { rows: 1, columns: 1, order: [["btn-1"]] },
    });
  });

  test("handles manifest referencing missing board file", async () => {
    const manifest = JSON.stringify({
      format: "open-board-0.1",
      root: "boards/missing.obf",
      paths: { boards: { missing: "boards/missing.obf" }, images: {} },
    });
    const filesWithMissingBoard = new Map([
      ["manifest.json", new TextEncoder().encode(manifest)],
    ]);
    const zipBuffer = await zip(filesWithMissingBoard);

    const result = await extractOBZ(zipBuffer.buffer as ArrayBuffer);

    expect(result.boards.size).toBe(0);
    expect(result.boards.has("missing")).toBe(false);
  });
});

describe("loadOBZ", () => {
  test("loads OBZ package from File object", async () => {
    const board: OBFBoard = {
      format: "open-board-0.1",
      id: "test",
      buttons: [],
      grid: { rows: 1, columns: 1, order: [[null]] },
    };

    const obzBlob = await createOBZ([board], "test");
    const file = new File([obzBlob], "test.obz", { type: "application/zip" });

    const result = await loadOBZ(file);

    expect(result.manifest.root).toBe("boards/test.obf");
    expect(result.boards.get("test")).toBeDefined();
  });

  test("rejects non-ZIP file", async () => {
    const notZipFile = new File([new ArrayBuffer(10)], "fake.obz");

    await expect(loadOBZ(notZipFile)).rejects.toThrow(
      "Invalid OBZ: not a ZIP file",
    );
  });
});

describe("createOBZ", () => {
  test("includes resources in archive", async () => {
    const board: OBFBoard = {
      format: "open-board-0.1",
      id: "board-1",
      buttons: [],
      grid: { rows: 1, columns: 1, order: [[null]] },
    };
    const imageData = new Uint8Array([1, 2, 3, 4]);
    const resources = new Map([["images/test.png", imageData]]);

    const obzBlob = await createOBZ([board], "board-1", resources);
    const extracted = await extractOBZ(await obzBlob.arrayBuffer());

    expect(extracted.files.get("images/test.png")).toEqual(imageData);
  });
});

describe("Integration: createOBZ and extractOBZ", () => {
  test("round-trip preserves boards", async () => {
    const board: OBFBoard = {
      format: "open-board-0.1",
      id: "board-1",
      buttons: [{ id: "btn-1", label: "Test" }],
      grid: { rows: 1, columns: 1, order: [["btn-1"]] },
    };

    const obzBlob = await createOBZ([board], "board-1");
    const obzBuffer = await obzBlob.arrayBuffer();
    const extracted = await extractOBZ(obzBuffer);

    expect(extracted.manifest.root).toBe("boards/board-1.obf");
    expect(extracted.boards.get("board-1")).toMatchObject({
      id: "board-1",
      buttons: [{ id: "btn-1", label: "Test" }],
    });
  });

  test("round-trip handles multiple boards", async () => {
    const board1: OBFBoard = {
      format: "open-board-0.1",
      id: "board-1",
      buttons: [
        { id: "btn-1", label: "Go to 2", load_board: { id: "board-2" } },
      ],
      grid: { rows: 1, columns: 1, order: [["btn-1"]] },
    };
    const board2: OBFBoard = {
      format: "open-board-0.1",
      id: "board-2",
      buttons: [{ id: "btn-2", label: "Back" }],
      grid: { rows: 1, columns: 1, order: [["btn-2"]] },
    };

    const obzBlob = await createOBZ([board1, board2], "board-1");
    const extracted = await extractOBZ(await obzBlob.arrayBuffer());

    expect(extracted.boards.size).toBe(2);

    const extractedBoard1 = extracted.boards.get("board-1");
    expect(extractedBoard1?.buttons[0].label).toBe("Go to 2");
    expect(extractedBoard1?.buttons[0].load_board?.id).toBe("board-2");

    const extractedBoard2 = extracted.boards.get("board-2");
    expect(extractedBoard2?.buttons[0].label).toBe("Back");
  });
});
