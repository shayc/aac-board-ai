import { describe, expect, test } from "vitest";
import { createOBZ, extractOBZ, parseManifest } from "../obz";
import type { OBFBoard } from "../schema";

describe("parseManifest", () => {
  test("parses valid manifest", () => {
    const validManifest = JSON.stringify({
      format: "open-board-0.1",
      root: "boards/test.obf",
      paths: { boards: { test: "boards/test.obf" }, images: {} },
    });

    expect(() => parseManifest(validManifest)).not.toThrow();
  });

  test("throws for invalid manifest format", () => {
    const invalidManifest = JSON.stringify({ format: "wrong-format" });

    expect(() => parseManifest(invalidManifest)).toThrow(/Invalid manifest/);
  });
});

describe("extractOBZ", () => {
  test("extracts valid OBZ archive", async () => {
    const { zip } = await import("../zip");
    const board: OBFBoard = {
      format: "open-board-0.1",
      id: "test",
      buttons: [],
      grid: { rows: 1, columns: 1, order: [[null]] },
    };
    const manifest = {
      format: "open-board-0.1",
      root: "boards/test.obf",
      paths: { boards: { test: "boards/test.obf" }, images: {} },
    };
    const files = new Map([
      ["manifest.json", new TextEncoder().encode(JSON.stringify(manifest))],
      ["boards/test.obf", new TextEncoder().encode(JSON.stringify(board))],
    ]);
    const zipBuffer = await zip(files);

    const result = await extractOBZ(zipBuffer.buffer as ArrayBuffer);

    expect(result.manifest.root).toBe("boards/test.obf");
    expect(result.boards.get("test")).toBeDefined();
  });

  test("throws for non-ZIP input", async () => {
    const notZip = new ArrayBuffer(10);

    await expect(extractOBZ(notZip)).rejects.toThrow(
      "Invalid OBZ: not a ZIP file",
    );
  });

  test("throws for missing manifest.json", async () => {
    const { zip } = await import("../zip");
    const filesWithoutManifest = new Map([
      ["boards/test.obf", new TextEncoder().encode("{}")],
    ]);
    const zipBuffer = await zip(filesWithoutManifest);

    await expect(extractOBZ(zipBuffer.buffer as ArrayBuffer)).rejects.toThrow(
      "Invalid OBZ: missing manifest.json",
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
    expect(extracted.boards.get("board-1")).toBeDefined();
    expect(extracted.boards.get("board-2")).toBeDefined();
  });
});
