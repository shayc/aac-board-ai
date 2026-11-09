import { assertDefined } from "@shared/testing/assert-defined";
import {
  loadOBF,
  loadOBZ,
  OBFError,
  type OBFBoard,
} from "@shayc/open-board-format";
import { beforeEach, describe, expect, test } from "vitest";
import { listBoardSets } from "../board-sets/board-sets-store";
import { getAssetBlob, getBoardRecord } from "../storage/board-content-storage";
import { listBoardSetRecords } from "../storage/board-set-storage";
import {
  countStoredBoardContent,
  loadFixtureFile,
  makeCorruptBoardFile,
  makeOBFBoard,
  makeOversizedOBZ,
  resetBoardsDB,
} from "../testing";
import {
  buildAssetInputs,
  importBoardFile,
  importEachBoardFile,
  resolveBoardLinks,
} from "./board-import";

const OBZ_FIXTURE = "lots-of-stuff.obz";
const OBF_FIXTURE = "lots-of-stuff.obf";
const IMPORTED_SET_ID = "lots-of-stuff";

describe("importBoardFile", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("imports an OBF file into IndexedDB and refreshes the board-set library", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);
    const board = await loadOBF(fixtureFile);

    expect(await listBoardSets()).toHaveLength(0);

    const importedBoardSet = await importBoardFile(fixtureFile);

    expect(importedBoardSet).toEqual({
      id: IMPORTED_SET_ID,
      rootBoardId: board.id,
    });

    expect(await listBoardSets()).toEqual([
      expect.objectContaining({ id: IMPORTED_SET_ID }),
    ]);

    const boardSets = await listBoardSetRecords();

    expect(boardSets).toHaveLength(1);
    expect(boardSets[0]).toMatchObject({
      id: IMPORTED_SET_ID,
      rootBoardId: board.id,
      boardCount: 1,
      name: board.name,
      locale: board.locale,
      gridRows: board.grid.rows,
      gridColumns: board.grid.columns,
    });

    const storedBoard = await getBoardRecord(IMPORTED_SET_ID, board.id);
    assertDefined(storedBoard);

    expect(storedBoard.name).toBe(board.name ?? board.id);
    expect(storedBoard.obf.buttons.length).toBe(board.buttons.length);
    expect(storedBoard.obf.grid).toEqual(board.grid);

    expect((await countStoredBoardContent(IMPORTED_SET_ID)).assetCount).toBe(0);
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

    const importedBoardSet = await importBoardFile(fixtureFile);

    expect(importedBoardSet).toEqual({
      id: IMPORTED_SET_ID,
      rootBoardId,
    });

    const boardSets = await listBoardSetRecords();

    expect(boardSets).toHaveLength(1);
    expect(boardSets[0]).toMatchObject({
      id: IMPORTED_SET_ID,
      rootBoardId,
      boardCount: archive.boards.size,
      name: archive.boards.get(rootBoardId)?.name,
    });

    const counts = await countStoredBoardContent(IMPORTED_SET_ID);
    expect(counts.boardCount).toBe(archive.boards.size);
    expect(counts.assetCount).toBe(assetEntries.length);

    const storedRootBoard = await getBoardRecord(IMPORTED_SET_ID, rootBoardId);
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

      const storedChildBoard = await getBoardRecord(
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

    const importedBoardSet = await importBoardFile(zipNamedFile);

    expect(importedBoardSet.id).toBe(IMPORTED_SET_ID);

    const boardSets = await listBoardSetRecords();
    expect(archive.boards.size).toBeGreaterThan(1);
    expect(boardSets[0]).toMatchObject({
      id: IMPORTED_SET_ID,
      boardCount: archive.boards.size,
    });
  });

  test("falls back to a default boardSetId when the filename is only an extension", async () => {
    const obzFile = await loadFixtureFile(OBZ_FIXTURE);
    const extensionOnlyFile = new File([obzFile], ".obz", {
      type: "application/octet-stream",
    });

    const importedBoardSet = await importBoardFile(extensionOnlyFile);

    expect(importedBoardSet.id).toBe("imported-board");
  });

  test("names the board set after its file when the root board name is blank", async () => {
    const board = makeOBFBoard({ id: "root", name: "  " });
    const boardFile = new File([JSON.stringify(board)], "core.obf", {
      type: "application/json",
    });

    await importBoardFile(boardFile);

    expect((await listBoardSetRecords())[0]?.name).toBe("core.obf");
  });

  test("clamps the derived boardSetId to 255 characters", async () => {
    const obfFile = await loadFixtureFile(OBF_FIXTURE);
    const longNamedFile = new File([obfFile], `${"x".repeat(300)}.obf`, {
      type: "application/octet-stream",
    });

    const importedBoardSet = await importBoardFile(longNamedFile);

    expect(importedBoardSet.id).toBe("x".repeat(255));
  });

  test("re-importing the same filename keeps both board sets", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);

    const first = await importBoardFile(fixtureFile);
    expect(first.id).toBe(IMPORTED_SET_ID);

    const second = await importBoardFile(fixtureFile);
    expect(second.id).toBe(`${IMPORTED_SET_ID}-2`);

    const boardSets = await listBoardSetRecords();
    expect(new Set(boardSets.map((set) => set.id))).toEqual(
      new Set([`${IMPORTED_SET_ID}-2`, IMPORTED_SET_ID]),
    );
  });

  test("a filename collision preserves the existing boards and assets", async () => {
    const obzFile = await loadFixtureFile(OBZ_FIXTURE);
    const archive = await loadOBZ(obzFile);
    const originalFile = new File([obzFile], "board.obz");
    await importBoardFile(originalFile);

    const resourcePath = Array.from(archive.resources.keys()).find(
      (path) => !path.endsWith(".obf") && path !== "manifest.json",
    );
    assertDefined(resourcePath);

    const obfFile = await loadFixtureFile(OBF_FIXTURE);
    const collidingFile = new File([obfFile], "BOARD.json");
    const result = await importBoardFile(collidingFile);

    expect(result.id).toBe("board-2");
    expect(await getBoardRecord("board", archive.rootBoard.id)).toBeDefined();
    expect(await getAssetBlob("board", resourcePath)).toBeInstanceOf(Blob);
    expect(await listBoardSetRecords()).toHaveLength(2);
  });

  test("rejects an OBZ whose declared uncompressed size exceeds the per-entry limit", async () => {
    const file = await makeOversizedOBZ("zip-bomb.obz");

    const error = await importBoardFile(file).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(OBFError);
    expect(error).toMatchObject({
      info: { code: "archive-too-large", limit: "maxEntrySize" },
    });

    const boardSets = await listBoardSetRecords();
    expect(boardSets).toHaveLength(0);
  });
});

describe("importEachBoardFile", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("keeps importing after a file fails and reports the failure", async () => {
    const corruptFile = makeCorruptBoardFile("corrupt.obf");
    const goodFile = await loadFixtureFile(OBF_FIXTURE);

    const { importedBoardSets, failures } = await importEachBoardFile([
      corruptFile,
      goodFile,
    ]);

    expect(importedBoardSets.map((boardSet) => boardSet.id)).toEqual([
      IMPORTED_SET_ID,
    ]);
    expect(failures.map((failure) => failure.fileName)).toEqual([
      "corrupt.obf",
    ]);
    expect(await listBoardSetRecords()).toHaveLength(1);
  });
});

describe("resolveBoardLinks", () => {
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

    const result = resolveBoardLinks(board, pathToId);

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

    const result = resolveBoardLinks(board, pathToId);

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

    const result = resolveBoardLinks(board, pathToId);

    expect(result.buttons[0]?.load_board?.id).toBeUndefined();
  });

  test("passes through buttons without load_board", () => {
    const board: OBFBoard = {
      ...minimalBoard,
      buttons: [{ id: "btn-1", label: "Hello" }],
    };
    const pathToId = new Map([["boards/child.obf", "child-1"]]);

    const result = resolveBoardLinks(board, pathToId);

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
