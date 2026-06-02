import { loadOBF, loadOBZ } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test } from "vitest";
import {
  getAssetBlob,
  getBoard,
  listBoardSets,
  withBoardsDB,
} from "../storage/db";
import { resetBoardsDB } from "../storage/test-helpers";
import { writeBoardSetFiles } from "./board-import";

const SAMPLE_BOARDS_DIR = "/src/shared/testing/sample-boards";
const OBZ_FIXTURE = "lots-of-stuff.obz";
const OBF_FIXTURE = "lots-of-stuff.obf";

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

async function countBoards(setId: string): Promise<number> {
  return withBoardsDB((db) => db.countFromIndex("boards", "bySetId", setId));
}

async function countAssets(setId: string): Promise<number> {
  return withBoardsDB((db) => db.countFromIndex("assets", "bySetId", setId));
}

describe("writeBoardSetFiles", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("imports an OBF file into IndexedDB", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);
    const board = await loadOBF(fixtureFile);

    const [result] = await writeBoardSetFiles(fixtureFile);
    assertDefined(result);
    const { setId } = result;

    expect(setId).toBeTruthy();
    expect(result.boardId).toBe(board.id);

    await withBoardsDB(async (db) => {
      const boardSets = await listBoardSets(db);

      expect(boardSets).toHaveLength(1);
      expect(boardSets[0]).toMatchObject({
        setId,
        rootBoardId: board.id,
        boardCount: 1,
        name: board.name,
        locale: board.locale,
        gridRows: board.grid.rows,
        gridColumns: board.grid.columns,
      });

      const storedBoard = await getBoard(db, setId, board.id);
      assertDefined(storedBoard);

      expect(storedBoard.name).toBe(board.name ?? board.id);
      expect(storedBoard.obf.buttons.length).toBe(board.buttons.length);
      expect(storedBoard.obf.grid).toEqual(board.grid);

      const assetCount = await db.countFromIndex("assets", "bySetId", setId);
      expect(assetCount).toBe(0);
    });
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

    const [result] = await writeBoardSetFiles(fixtureFile);
    assertDefined(result);
    const { setId } = result;

    expect(setId).toBeTruthy();
    expect(result.boardId).toBe(rootBoardId);

    await withBoardsDB(async (db) => {
      const boardSets = await listBoardSets(db);

      expect(boardSets).toHaveLength(1);
      expect(boardSets[0]).toMatchObject({
        setId,
        rootBoardId,
        boardCount: archive.boards.size,
        name: archive.boards.get(rootBoardId)?.name,
      });

      const readTx = db.transaction(["boards", "assets"], "readonly");
      const storedBoardCount = await readTx
        .objectStore("boards")
        .index("bySetId")
        .count(setId);
      const storedAssetCount = await readTx
        .objectStore("assets")
        .index("bySetId")
        .count(setId);
      await readTx.done;

      expect(storedBoardCount).toBe(archive.boards.size);
      expect(storedAssetCount).toBe(assetEntries.length);

      const storedRootBoard = await getBoard(db, setId, rootBoardId);
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
          db,
          setId,
          expectedChildBoardId,
        );
        expect(storedChildBoard).toBeDefined();
      }

      const storedAsset = await getAssetBlob(db, setId, sampleAssetPath);

      expect(storedAsset).toBeInstanceOf(Blob);
      expect(storedAsset?.size).toBe(sampleAssetBytes.byteLength);
    });
  });

  test("re-importing the same board creates a distinct set with a disambiguated name", async () => {
    const fixtureFile = await loadFixtureFile(OBF_FIXTURE);
    const board = await loadOBF(fixtureFile);
    assertDefined(board.name);

    const [first] = await writeBoardSetFiles(fixtureFile);
    const [second] = await writeBoardSetFiles(fixtureFile);
    assertDefined(first);
    assertDefined(second);

    // Identity comes from a random id, so the second import never overwrites
    // the first — it lands as its own set the user can see and delete.
    expect(second.setId).not.toBe(first.setId);

    await withBoardsDB(async (db) => {
      const boardSets = await listBoardSets(db);
      const names = boardSets.map((set) => set.name).sort();

      expect(boardSets).toHaveLength(2);
      expect(names).toEqual([board.name, `${board.name} (2)`].sort());
    });
  });

  test("a failed import leaves the existing library and stores unchanged", async () => {
    const fixtureFile = await loadFixtureFile(OBZ_FIXTURE);
    const [imported] = await writeBoardSetFiles(fixtureFile);
    assertDefined(imported);

    const boardsBefore = await countBoards(imported.setId);
    const assetsBefore = await countAssets(imported.setId);

    const corruptFile = new File(["this is not a board"], "broken.obf", {
      type: "application/json",
    });

    await expect(writeBoardSetFiles(corruptFile)).rejects.toThrow();

    // The boardSet record is written last, so a failed import surfaces nothing:
    // no half-written set, and no orphaned boards/assets under a new id.
    await withBoardsDB(async (db) => {
      const boardSets = await listBoardSets(db);

      expect(boardSets).toHaveLength(1);
      expect(boardSets[0]?.setId).toBe(imported.setId);

      const totalBoards = await db.count("boards");
      const totalAssets = await db.count("assets");

      expect(totalBoards).toBe(boardsBefore);
      expect(totalAssets).toBe(assetsBefore);
    });
  });
});
