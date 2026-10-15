import { deleteDB } from "idb";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { makeOBFBoard, resetBoardsDB } from "../testing";
import {
  getAssetBlob,
  getBoard,
  listBoards,
  updateBoardStrings,
} from "./board-content-storage";
import {
  createBoardSet,
  getBoardSet,
  listBoardSets,
  deleteBoardSet,
} from "./board-set-storage";
import { closeBoardsDB, getBoardsDB, normalizeAssetPath } from "./boards-db";

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

describe("getBoardsDB", () => {
  test("creates a fresh database that persists boards, translations, and assets", async () => {
    await closeBoardsDB();
    await deleteDB("aac-boards-db");
    const obf = makeOBFBoard({
      id: "root",
      strings: { fr: { Hello: "Bonjour" } },
    });

    await createBoardSet({
      id: "vocabulary",
      name: "Vocabulary",
      rootBoardId: "root",
      boards: [obf],
      assets: [{ path: "image.png", blob: new Blob(["image"]) }],
    });
    await closeBoardsDB();

    expect((await getBoardsDB()).version).toBe(1);
    expect(await getBoardSet("vocabulary")).toMatchObject({
      id: "vocabulary",
      name: "Vocabulary",
      rootBoardId: "root",
      boardCount: 1,
    });
    expect(await getBoard("vocabulary", "root")).toEqual({
      setId: "vocabulary",
      id: "root",
      name: obf.name,
      obf,
    });
    expect(await listBoardSets()).toHaveLength(1);
    expect(await listBoards("vocabulary")).toHaveLength(1);
    expect(await (await getAssetBlob("vocabulary", "image.png"))?.text()).toBe(
      "image",
    );

    await updateBoardStrings("vocabulary", "root", "es", { Hello: "Hola" });
    expect((await getBoard("vocabulary", "root"))?.obf.strings).toEqual({
      fr: { Hello: "Bonjour" },
      es: { Hello: "Hola" },
    });

    await deleteBoardSet("vocabulary");
    expect(await listBoards("vocabulary")).toEqual([]);
    expect(await getBoardSet("vocabulary")).toBeUndefined();
    expect(await getAssetBlob("vocabulary", "image.png")).toBeUndefined();
  });

  test("reuses one connection across calls", async () => {
    const [first, second] = await Promise.all([getBoardsDB(), getBoardsDB()]);

    expect(first).toBe(second);
  });

  test("reopens a fresh, usable connection after closeBoardsDB", async () => {
    const first = await getBoardsDB();
    await closeBoardsDB();

    const second = await getBoardsDB();
    expect(second).not.toBe(first);

    await second.add("boardSets", {
      id: "set-1",
      name: "Persisted",
      rootBoardId: "root-1",
      updatedAt: 1,
      boardCount: 0,
    });
    expect((await second.get("boardSets", "set-1"))?.name).toBe("Persisted");
  });
});

describe("normalizeAssetPath", () => {
  test.each(["", "/", "////", "\\"])(
    "rejects a path that normalizes to empty: %j",
    (rawPath) => {
      expect(() => normalizeAssetPath(rawPath)).toThrow("Path cannot be empty");
    },
  );
});
