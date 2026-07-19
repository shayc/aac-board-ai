import { assertDefined } from "@shared/testing/assert-defined";
import {
  loadOBF,
  loadOBZ,
  OBFError,
  zip,
  type OBFBoard,
} from "@shayc/open-board-format";
import { beforeEach, describe, expect, test } from "vitest";
import {
  getAssetBlob,
  getBoard,
  getBoardsDB,
  listBoardSets,
} from "../storage/boards-db";
import { loadFixtureFile, resetBoardsDB } from "../testing";
import {
  BOARD_IMPORT_LIMITS,
  buildAssetInputs,
  importBoardSets,
  resolveLoadBoardPaths,
} from "./board-import";

const OBZ_FIXTURE = "lots-of-stuff.obz";
const OBF_FIXTURE = "lots-of-stuff.obf";
const IMPORTED_SET_ID = "lots-of-stuff";

describe("importBoardSets", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("imports an OBF file into IndexedDB", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);
    const board = await loadOBF(fixtureFile);

    const importResults = await importBoardSets(fixtureFile);

    expect(importResults).toEqual([
      {
        setId: IMPORTED_SET_ID,
        rootBoardId: board.id,
      },
    ]);

    const db = await getBoardsDB();
    const boardSets = await listBoardSets();

    expect(boardSets).toHaveLength(1);
    expect(boardSets[0]).toMatchObject({
      setId: IMPORTED_SET_ID,
      rootBoardId: board.id,
      boardCount: 1,
      name: board.name,
      locale: board.locale,
      gridRows: board.grid.rows,
      gridColumns: board.grid.columns,
    });

    const storedBoard = await getBoard(IMPORTED_SET_ID, board.id);
    assertDefined(storedBoard);

    expect(storedBoard.name).toBe(board.name ?? board.id);
    expect(storedBoard.obf.buttons.length).toBe(board.buttons.length);
    expect(storedBoard.obf.grid).toEqual(board.grid);

    const assetCount = await db.countFromIndex(
      "assets",
      "bySetId",
      IMPORTED_SET_ID,
    );
    expect(assetCount).toBe(0);
  });

  test("imports an OBZ file into IndexedDB", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    const archive = await loadOBZ(fixtureFile);

    const rootBoardId = archive.rootBoard.id;

    const assetEntries = Array.from(archive.resources.entries()).filter(
      ([path]) => !path.endsWith(".obf") && path !== "manifest.json",
    );

    const sampleAssetEntry = assetEntries[0];
    assertDefined(sampleAssetEntry);
    const [sampleAssetPath, sampleAssetBytes] = sampleAssetEntry;

    const importResults = await importBoardSets(fixtureFile);

    expect(importResults).toEqual([
      {
        setId: IMPORTED_SET_ID,
        rootBoardId,
      },
    ]);

    const db = await getBoardsDB();
    const boardSets = await listBoardSets();

    expect(boardSets).toHaveLength(1);
    expect(boardSets[0]).toMatchObject({
      setId: IMPORTED_SET_ID,
      rootBoardId,
      boardCount: archive.boards.size,
      name: archive.boards.get(rootBoardId)?.name,
    });

    const readTx = db.transaction(["boards", "assets"], "readonly");
    const storedBoardCount = await readTx
      .objectStore("boards")
      .index("bySetId")
      .count(IMPORTED_SET_ID);
    const storedAssetCount = await readTx
      .objectStore("assets")
      .index("bySetId")
      .count(IMPORTED_SET_ID);
    await readTx.done;

    expect(storedBoardCount).toBe(archive.boards.size);
    expect(storedAssetCount).toBe(assetEntries.length);

    const storedRootBoard = await getBoard(IMPORTED_SET_ID, rootBoardId);
    assertDefined(storedRootBoard);

    const boardLinks = storedRootBoard.obf.buttons.flatMap((button) =>
      button.load_board?.path
        ? [{ path: button.load_board.path, id: button.load_board.id }]
        : [],
    );

    expect(boardLinks.length).toBeGreaterThan(0);

    const pathToId = new Map(
      Object.entries(archive.manifest.paths.boards).map(([id, path]) => [
        path,
        id,
      ]),
    );

    for (const link of boardLinks) {
      const expectedChildBoardId = pathToId.get(link.path);
      assertDefined(expectedChildBoardId);

      expect(link.id).toBe(expectedChildBoardId);

      const storedChildBoard = await getBoard(
        IMPORTED_SET_ID,
        expectedChildBoardId,
      );
      expect(storedChildBoard).toBeDefined();
    }

    const storedAsset = await getAssetBlob(IMPORTED_SET_ID, sampleAssetPath);

    expect(storedAsset).toBeInstanceOf(Blob);
    expect(storedAsset?.size).toBe(sampleAssetBytes.byteLength);
  });

  test("detects an OBZ archive by content even when its name is not .obz", async () => {
    const obzFile = await loadFixtureFile(OBZ_FIXTURE);
    const archive = await loadOBZ(obzFile);
    const zipNamedFile = new File([obzFile], "lots-of-stuff.zip", {
      type: "application/zip",
    });

    const importResults = await importBoardSets(zipNamedFile);

    expect(importResults).toHaveLength(1);
    expect(importResults[0].setId).toBe(IMPORTED_SET_ID);

    const boardSets = await listBoardSets();
    expect(archive.boards.size).toBeGreaterThan(1);
    expect(boardSets[0]).toMatchObject({
      setId: IMPORTED_SET_ID,
      boardCount: archive.boards.size,
    });
  });

  test("falls back to a default setId when the filename is only an extension", async () => {
    const obzFile = await loadFixtureFile(OBZ_FIXTURE);
    const extensionOnlyFile = new File([obzFile], ".obz", {
      type: "application/octet-stream",
    });

    const importResults = await importBoardSets(extensionOnlyFile);

    expect(importResults[0].setId).toBe("imported-board");
  });

  test("clamps the derived setId to 255 characters", async () => {
    const obfFile = await loadFixtureFile(OBF_FIXTURE);
    const longNamedFile = new File([obfFile], `${"x".repeat(300)}.obf`, {
      type: "application/octet-stream",
    });

    const importResults = await importBoardSets(longNamedFile);

    expect(importResults[0].setId).toBe("x".repeat(255));
  });

  test("re-importing the same filename keeps both board sets", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);

    const first = await importBoardSets(fixtureFile);
    expect(first[0].setId).toBe(IMPORTED_SET_ID);

    const second = await importBoardSets(fixtureFile);
    expect(second[0].setId).toBe(`${IMPORTED_SET_ID}-2`);

    const boardSets = await listBoardSets();
    expect(new Set(boardSets.map((set) => set.setId))).toEqual(
      new Set([`${IMPORTED_SET_ID}-2`, IMPORTED_SET_ID]),
    );
  });

  test("a filename collision preserves the existing boards and assets", async () => {
    const obzFile = await loadFixtureFile(OBZ_FIXTURE);
    const archive = await loadOBZ(obzFile);
    const originalFile = new File([obzFile], "board.obz");
    await importBoardSets(originalFile);

    const resourcePath = Array.from(archive.resources.keys()).find(
      (path) => !path.endsWith(".obf") && path !== "manifest.json",
    );
    assertDefined(resourcePath);

    const obfFile = await loadFixtureFile(OBF_FIXTURE);
    const collidingFile = new File([obfFile], "BOARD.json");
    const [result] = await importBoardSets(collidingFile);

    expect(result.setId).toBe("board-2");
    expect(await getBoard("board", archive.rootBoard.id)).toBeDefined();
    expect(await getAssetBlob("board", resourcePath)).toBeInstanceOf(Blob);
    expect(await listBoardSets()).toHaveLength(2);
  });

  test("rejects an OBZ whose declared uncompressed size exceeds the per-entry limit", async () => {
    // A buffer of zeros compresses to a tiny archive, but its central-directory
    // metadata declares the full uncompressed size — so the limit trips on the
    // declared size before any inflation happens (zip-bomb defense).
    const oversized = new Uint8Array(BOARD_IMPORT_LIMITS.maxEntrySize! + 1);
    const zipped = await zip(new Map([["big.bin", oversized]]));
    const file = new File([zipped as Uint8Array<ArrayBuffer>], "zip-bomb.obz", {
      type: "application/octet-stream",
    });

    const error = await importBoardSets(file).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(OBFError);
    expect(error).toMatchObject({
      info: { code: "archive-too-large", limit: "maxEntrySize" },
    });

    const boardSets = await listBoardSets();
    expect(boardSets).toHaveLength(0);
  });

  test("a failure partway through a multi-file import still leaves the earlier set visible", async () => {
    const goodFile = await loadFixtureFile(OBF_FIXTURE);
    const corruptFile = new File(["not valid json"], "corrupt.obf", {
      type: "application/json",
    });

    await expect(importBoardSets([goodFile, corruptFile])).rejects.toThrow();

    const boardSets = await listBoardSets();
    expect(boardSets.map((set) => set.setId)).toContain(IMPORTED_SET_ID);
  });
});

describe("resolveLoadBoardPaths", () => {
  const minimalBoard: OBFBoard = {
    format: "open-board-0.1",
    id: "board-1",
    buttons: [],
    grid: { rows: 1, columns: 1, order: [[null]] },
  };

  test("resolves load_board path to id using pathToId map", () => {
    const board: OBFBoard = {
      ...minimalBoard,
      buttons: [
        { id: "btn-1", label: "Go", load_board: { path: "boards/child.obf" } },
      ],
    };
    const pathToId = new Map([["boards/child.obf", "child-1"]]);

    const result = resolveLoadBoardPaths(board, pathToId);

    expect(result.buttons[0]?.load_board?.id).toBe("child-1");
    expect(result.buttons[0]?.load_board?.path).toBe("boards/child.obf");
  });

  test("skips buttons that already have a load_board id", () => {
    const board: OBFBoard = {
      ...minimalBoard,
      buttons: [
        {
          id: "btn-1",
          label: "Go",
          load_board: { id: "existing-id", path: "boards/child.obf" },
        },
      ],
    };
    const pathToId = new Map([["boards/child.obf", "different-id"]]);

    const result = resolveLoadBoardPaths(board, pathToId);

    expect(result.buttons[0]?.load_board?.id).toBe("existing-id");
  });

  test("skips buttons with unmatched path", () => {
    const board: OBFBoard = {
      ...minimalBoard,
      buttons: [
        {
          id: "btn-1",
          label: "Go",
          load_board: { path: "boards/unknown.obf" },
        },
      ],
    };
    const pathToId = new Map([["boards/child.obf", "child-1"]]);

    const result = resolveLoadBoardPaths(board, pathToId);

    expect(result.buttons[0]?.load_board?.id).toBeUndefined();
  });

  test("passes through buttons without load_board", () => {
    const board: OBFBoard = {
      ...minimalBoard,
      buttons: [{ id: "btn-1", label: "Hello" }],
    };
    const pathToId = new Map([["boards/child.obf", "child-1"]]);

    const result = resolveLoadBoardPaths(board, pathToId);

    expect(result.buttons[0]?.load_board).toBeUndefined();
    expect(result.buttons[0]?.label).toBe("Hello");
  });
});

describe("buildAssetInputs", () => {
  test("excludes OBF and manifest entries regardless of case", () => {
    const resources = new Map([
      ["HOME.OBF", new Uint8Array()],
      ["Manifest.json", new Uint8Array()],
      ["images/cat.png", new Uint8Array([1, 2, 3])],
    ]);

    const assets = buildAssetInputs(resources);

    expect(assets.map((asset) => asset.path)).toEqual(["images/cat.png"]);
  });
});
