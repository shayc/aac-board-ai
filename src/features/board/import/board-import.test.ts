import { loadOBF, loadOBZ, type OBFBoard } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test } from "vitest";
import {
  getAssetBlob,
  getBoard,
  getBoardsDB,
  listBoardSets,
} from "../storage/db";
import { resetBoardsDB } from "../storage/test-helpers";
import { importFilesAsBoardSets, resolveLoadBoardPaths } from "./board-import";

const SAMPLE_BOARDS_DIR = "/src/shared/testing/sample-boards";
const OBZ_FIXTURE = "lots-of-stuff.obz";
const OBF_FIXTURE = "lots-of-stuff.obf";
const IMPORTED_SET_ID = "lots-of-stuff";

function assertDefined<T>(value: T | undefined | null): asserts value is T {
  expect(value).toBeDefined();
}

async function loadFixtureFile(name: string): Promise<File> {
  const response = await fetch(`${SAMPLE_BOARDS_DIR}/${name}`);

  if (!response.ok) {
    throw new Error(`Failed to load test fixture: ${response.status}`);
  }

  const blob = await response.blob();

  return new File([blob], name, {
    type: blob.type || "application/octet-stream",
  });
}

describe("importFilesAsBoardSets", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("imports an OBF file into IndexedDB", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);
    const board = await loadOBF(fixtureFile);

    const importResults = await importFilesAsBoardSets(fixtureFile);

    expect(importResults).toEqual([
      {
        setId: IMPORTED_SET_ID,
        boardId: board.id,
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

    const pathToId = new Map(
      Object.entries(archive.manifest.paths.boards).map(([id, path]) => [
        path,
        id,
      ]),
    );

    const rootBoardId = pathToId.get(archive.manifest.root);
    assertDefined(rootBoardId);

    const assetEntries = Array.from(archive.resources.entries()).filter(
      ([path]) => !path.endsWith(".obf") && path !== "manifest.json",
    );

    const sampleAssetEntry = assetEntries[0];
    assertDefined(sampleAssetEntry);
    const [sampleAssetPath, sampleAssetBytes] = sampleAssetEntry;

    const importResults = await importFilesAsBoardSets(fixtureFile);

    expect(importResults).toEqual([
      {
        setId: IMPORTED_SET_ID,
        boardId: rootBoardId,
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

    const linkedButtons = storedRootBoard.obf.buttons.filter((button) =>
      Boolean(button.load_board?.path),
    );

    expect(linkedButtons.length).toBeGreaterThan(0);

    for (const button of linkedButtons) {
      const expectedChildBoardId = pathToId.get(button.load_board!.path!);
      assertDefined(expectedChildBoardId);

      expect(button.load_board?.id).toBe(expectedChildBoardId);

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
