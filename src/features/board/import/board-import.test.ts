import { assertDefined } from "@shared/testing/assert-defined";
import {
  loadOBF,
  loadOBZ,
  OBFError,
  type OBFBoard,
} from "@shayc/open-board-format";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  getAssetBlob,
  getBoard,
  getBoardsDB,
  listBoardSets,
  updateBoardStrings,
} from "../storage/boards-db";
import { loadFixtureFile, makeOBFBoard, resetBoardsDB } from "../testing";
import {
  buildAssetInputs,
  importBoardSets,
  resolveLoadBoardPaths,
} from "./board-import";
import { BoardFileTooLargeError, MAX_BOARD_FILE_BYTES } from "./import-limits";

const OBZ_FIXTURE = "lots-of-stuff.obz";
const OBF_FIXTURE = "lots-of-stuff.obf";
const SET_ID_PATTERN = /^[0-9a-f-]{36}$/;

/** Patches declared uncompressed sizes in a ZIP's central directory, without touching entry data — for exercising decompression-bomb limits. */
async function declareEntrySizes(
  file: File,
  sizesByName: Record<string, number>,
): Promise<File> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);

  let eocd = bytes.length - 22;
  while (view.getUint32(eocd, true) !== 0x06054b50) {
    eocd -= 1;
  }

  const entryCount = view.getUint16(eocd + 8, true);
  let offset = view.getUint32(eocd + 16, true);
  const remaining = new Set(Object.keys(sizesByName));

  for (let i = 0; i < entryCount; i++) {
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const name = new TextDecoder().decode(
      bytes.subarray(offset + 46, offset + 46 + fileNameLength),
    );

    if (name in sizesByName) {
      view.setUint32(offset + 24, sizesByName[name], true);
      remaining.delete(name);
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  if (remaining.size > 0) {
    throw new Error(
      `Entries not found in archive: ${[...remaining].join(", ")}`,
    );
  }

  return new File([bytes], file.name, { type: file.type });
}

describe("importBoardSets", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("imports an OBF file into IndexedDB", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);
    const board = await loadOBF(fixtureFile);

    const importResults = await importBoardSets(fixtureFile);

    expect(importResults).toHaveLength(1);
    const [result] = importResults;
    assertDefined(result);
    expect(result.setId).toMatch(SET_ID_PATTERN);
    expect(result).toEqual({
      setId: result.setId,
      rootBoardId: board.id,
      alreadyExisted: false,
    });

    const db = await getBoardsDB();
    const boardSets = await listBoardSets();

    expect(boardSets).toHaveLength(1);
    expect(boardSets[0]).toMatchObject({
      setId: result.setId,
      rootBoardId: board.id,
      boardCount: 1,
      name: board.name,
      locale: board.locale,
      gridRows: board.grid.rows,
      gridColumns: board.grid.columns,
    });

    const storedBoard = await getBoard(result.setId, board.id);
    assertDefined(storedBoard);

    expect(storedBoard.name).toBe(board.name ?? board.id);
    expect(storedBoard.obf.buttons.length).toBe(board.buttons.length);
    expect(storedBoard.obf.grid).toEqual(board.grid);

    const assetCount = await db.countFromIndex(
      "assets",
      "bySetId",
      result.setId,
    );
    expect(assetCount).toBe(0);
  });

  test("imports an OBZ file into IndexedDB", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    const archive = await loadOBZ(fixtureFile);

    const assetEntries = Array.from(archive.resources.entries()).filter(
      ([path]) => !path.endsWith(".obf") && path !== "manifest.json",
    );

    const sampleAssetEntry = assetEntries[0];
    assertDefined(sampleAssetEntry);
    const [sampleAssetPath, sampleAssetBytes] = sampleAssetEntry;

    const importResults = await importBoardSets(fixtureFile);

    expect(importResults).toHaveLength(1);
    const [result] = importResults;
    assertDefined(result);
    expect(result.setId).toMatch(SET_ID_PATTERN);
    expect(result).toEqual({
      setId: result.setId,
      rootBoardId: archive.rootBoard.id,
      alreadyExisted: false,
    });

    const db = await getBoardsDB();
    const boardSets = await listBoardSets();

    expect(boardSets).toHaveLength(1);
    expect(boardSets[0]).toMatchObject({
      setId: result.setId,
      rootBoardId: archive.rootBoard.id,
      boardCount: archive.boards.size,
      name: archive.boards.get(archive.rootBoard.id)?.name,
    });

    const readTx = db.transaction(["boards", "assets"], "readonly");
    const storedBoardCount = await readTx
      .objectStore("boards")
      .index("bySetId")
      .count(result.setId);
    const storedAssetCount = await readTx
      .objectStore("assets")
      .index("bySetId")
      .count(result.setId);
    await readTx.done;

    expect(storedBoardCount).toBe(archive.boards.size);
    expect(storedAssetCount).toBe(assetEntries.length);

    const storedRootBoard = await getBoard(result.setId, archive.rootBoard.id);
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
        result.setId,
        expectedChildBoardId,
      );
      expect(storedChildBoard).toBeDefined();
    }

    const storedAsset = await getAssetBlob(result.setId, sampleAssetPath);

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
    const [result] = importResults;
    assertDefined(result);
    expect(result.setId).toMatch(SET_ID_PATTERN);

    const boardSets = await listBoardSets();
    expect(archive.boards.size).toBeGreaterThan(1);
    expect(boardSets[0]).toMatchObject({
      setId: result.setId,
      boardCount: archive.boards.size,
    });
  });

  test("two different files with the same filename import as independent sets", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);
    const firstFile = new File([fixtureFile], "shared-name.obf", {
      type: fixtureFile.type,
    });

    const otherBoard = makeOBFBoard({ id: "other-board", name: "Other Board" });
    const secondFile = new File(
      [JSON.stringify(otherBoard)],
      "shared-name.obf",
      { type: "application/json" },
    );

    const [firstResult] = await importBoardSets(firstFile);
    assertDefined(firstResult);
    const firstBoardBefore = await getBoard(
      firstResult.setId,
      firstResult.rootBoardId,
    );
    assertDefined(firstBoardBefore);

    const [secondResult] = await importBoardSets(secondFile);
    assertDefined(secondResult);

    expect(secondResult.setId).not.toBe(firstResult.setId);

    const boardSets = await listBoardSets();
    expect(boardSets).toHaveLength(2);

    const firstBoardAfter = await getBoard(
      firstResult.setId,
      firstResult.rootBoardId,
    );
    expect(firstBoardAfter).toEqual(firstBoardBefore);
  });

  test("re-importing the same file dedups to the existing set", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);

    const [first] = await importBoardSets(fixtureFile);
    assertDefined(first);
    expect(first.alreadyExisted).toBe(false);

    const [second] = await importBoardSets(fixtureFile);
    expect(second).toEqual({ ...first, alreadyExisted: true });

    const boardSets = await listBoardSets();
    expect(boardSets).toHaveLength(1);
  });

  test("importing the same file twice in one batch writes once and dedups the second", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);

    const [first, second] = await importBoardSets([fixtureFile, fixtureFile]);
    assertDefined(first);
    expect(first.alreadyExisted).toBe(false);
    expect(second).toEqual({ ...first, alreadyExisted: true });

    const boardSets = await listBoardSets();
    expect(boardSets).toHaveLength(1);
  });

  test("caching a translation does not break dedup on re-import", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);

    const [result] = await importBoardSets(fixtureFile);
    assertDefined(result);

    await updateBoardStrings(result.setId, result.rootBoardId, "es", {
      hello: "hola",
    });

    const [reImportResult] = await importBoardSets(fixtureFile);
    assertDefined(reImportResult);

    expect(reImportResult.alreadyExisted).toBe(true);
    expect(reImportResult.setId).toBe(result.setId);

    const boardSets = await listBoardSets();
    expect(boardSets).toHaveLength(1);
  });

  test("rejects a local file over the byte limit before any read", async () => {
    const hugeFile = new File(
      [new ArrayBuffer(MAX_BOARD_FILE_BYTES + 1)],
      "big.obz",
    );

    await expect(importBoardSets(hugeFile)).rejects.toThrow(
      BoardFileTooLargeError,
    );

    expect(await listBoardSets()).toHaveLength(0);
  });

  test("rejects an archive whose declared uncompressed size exceeds the total limit", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    const oversizedFile = await declareEntrySizes(fixtureFile, {
      "boards/inline_images.obf": 150_000_000,
      "boards/linked_board.obf": 150_000_000,
      "boards/root_board.obf": 150_000_000,
      "images/happy.png": 150_000_000,
    });

    const error: unknown = await importBoardSets(oversizedFile).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(OBFError);
    expect((error as InstanceType<typeof OBFError>).info.code).toBe(
      "archive-too-large",
    );

    expect(await listBoardSets()).toHaveLength(0);
  });

  test("a failure partway through a multi-file import still leaves the earlier set visible", async () => {
    const goodFile = await loadFixtureFile(OBF_FIXTURE);
    const corruptFile = new File(["not valid json"], "corrupt.obf", {
      type: "application/json",
    });

    await expect(importBoardSets([goodFile, corruptFile])).rejects.toThrow();

    const boardSets = await listBoardSets();
    expect(boardSets).toHaveLength(1);
  });

  describe("without crypto.subtle (insecure context)", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    test("imports without a sourceHash and re-imports create separate sets", async () => {
      vi.stubGlobal("crypto", {
        getRandomValues: crypto.getRandomValues.bind(crypto),
      });

      const fixtureFile = await loadFixtureFile(OBF_FIXTURE);

      const [first] = await importBoardSets(fixtureFile);
      assertDefined(first);
      expect(first.alreadyExisted).toBe(false);

      const storedFirst = await listBoardSets();
      expect(
        storedFirst.find((set) => set.setId === first.setId)?.sourceHash,
      ).toBeUndefined();

      const [second] = await importBoardSets(fixtureFile);
      assertDefined(second);
      expect(second.alreadyExisted).toBe(false);
      expect(second.setId).not.toBe(first.setId);

      const boardSets = await listBoardSets();
      expect(boardSets).toHaveLength(2);
    });
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
