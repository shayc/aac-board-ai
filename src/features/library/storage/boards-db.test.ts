import { deleteDB, openDB } from "idb";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { resetBoardsDB } from "../testing";
import { closeBoardsDB, getBoardsDB } from "./boards-db";

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

describe("getBoardsDB", () => {
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
      importedAt: 1,
      boardCount: 0,
    });
    expect((await second.get("boardSets", "set-1"))?.name).toBe("Persisted");
  });

  test("drops version 1 board sets and opens a usable database", async () => {
    const { name } = await getBoardsDB();
    await closeBoardsDB();
    await deleteDB(name);
    const versionOne = await openDB(name, 1, {
      upgrade(db) {
        const boardSets = db.createObjectStore("boardSets", { keyPath: "id" });
        boardSets.createIndex("byImportedAt", "importedAt");

        db.createObjectStore("boards", { keyPath: ["boardSetId", "id"] });
        db.createObjectStore("assets", { keyPath: ["boardSetId", "path"] });
      },
    });
    await versionOne.add("boardSets", { id: "old-set", importedAt: 1 });
    await versionOne.add("boards", { boardSetId: "old-set", id: "root" });
    await versionOne.add("assets", { boardSetId: "old-set", path: "a.png" });
    versionOne.close();

    const upgraded = await getBoardsDB();

    expect(await upgraded.getAll("boardSets")).toEqual([]);
    expect(await upgraded.getAll("boards")).toEqual([]);
    expect(await upgraded.getAll("assets")).toEqual([]);

    await upgraded.add("boardSets", {
      id: "set-1",
      name: "Imported",
      rootBoardId: "root-1",
      importedAt: 1,
      boardCount: 0,
    });
    expect(
      await upgraded.getAllFromIndex("boardSets", "byImportedAt"),
    ).toHaveLength(1);
  });
});
