import type { OBFBoard } from "@shayc/open-board-format";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  closeBoardsDB,
  deleteBoardSetRecord,
  getAssetBlob,
  getBoard,
  getBoardsDB,
  listBoardSets,
  putAssets,
  putBoards,
  updateBoardStrings,
  upsertBoardSet,
  type UpsertBoardSetInput,
} from "./boards-db";
import { clearBoardsDB } from "./test-helpers";

function makeBoardSetInput(
  overrides: Partial<UpsertBoardSetInput> = {},
): UpsertBoardSetInput {
  return { setId: "set-1", name: "Set", rootBoardId: "root-1", ...overrides };
}

function makeOBFBoard(overrides: Partial<OBFBoard> = {}): OBFBoard {
  return {
    format: "open-board-0.1",
    id: "board-1",
    locale: "en",
    name: "Test Board",
    buttons: [],
    grid: { rows: 1, columns: 1, order: [[null]] },
    images: [],
    sounds: [],
    ...overrides,
  };
}

beforeEach(async () => {
  await clearBoardsDB();
});

afterEach(closeBoardsDB);

describe("upsertBoardSet", () => {
  test("inserts a new board set", async () => {
    await upsertBoardSet(makeBoardSetInput({ name: "My Set" }));

    const sets = await listBoardSets();
    expect(sets).toHaveLength(1);
    expect(sets[0].setId).toBe("set-1");
    expect(sets[0].name).toBe("My Set");
    expect(sets[0].boardCount).toBe(0);
  });

  test("preserves boardCount on upsert", async () => {
    await upsertBoardSet(makeBoardSetInput());
    const obf = makeOBFBoard({ id: "b1" });
    await putBoards("set-1", [{ boardId: "b1", name: "B1", obf }]);

    await upsertBoardSet(makeBoardSetInput({ name: "Set Renamed" }));

    const sets = await listBoardSets();
    expect(sets[0].boardCount).toBe(1);
  });

  test("rejects empty setId", async () => {
    await expect(
      upsertBoardSet(makeBoardSetInput({ setId: "", name: "Bad" })),
    ).rejects.toThrow("Invalid setId");
  });

  test("rejects setId longer than 255 characters", async () => {
    await expect(
      upsertBoardSet(
        makeBoardSetInput({ setId: "x".repeat(256), name: "Bad" }),
      ),
    ).rejects.toThrow("Invalid setId");
  });
});

describe("listBoardSets", () => {
  test("returns empty array when no sets exist", async () => {
    const sets = await listBoardSets();
    expect(sets).toEqual([]);
  });

  test("returns sets sorted by updatedAt descending", async () => {
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => (now += 1000));

    await upsertBoardSet(makeBoardSetInput({ setId: "old", name: "Old" }));
    await upsertBoardSet(makeBoardSetInput({ setId: "new", name: "New" }));

    const sets = await listBoardSets();
    expect(sets).toHaveLength(2);
    expect(sets[0].setId).toBe("new");
    expect(sets[1].setId).toBe("old");
  });
});

describe("putBoards and getBoard", () => {
  test("stores and retrieves a board", async () => {
    await upsertBoardSet(makeBoardSetInput());

    const obf = makeOBFBoard({ id: "b1", name: "Board One" });
    await putBoards("set-1", [{ boardId: "b1", name: "Board One", obf }]);

    const board = await getBoard("set-1", "b1");
    expect(board).toBeDefined();
    expect(board!.boardId).toBe("b1");
    expect(board!.name).toBe("Board One");
    expect(board!.obf.id).toBe("b1");
  });

  test("counts only unique boards", async () => {
    await upsertBoardSet(makeBoardSetInput());

    const obf = makeOBFBoard({ id: "b1" });
    await putBoards("set-1", [{ boardId: "b1", name: "B1", obf }]);

    let sets = await listBoardSets();
    expect(sets[0].boardCount).toBe(1);

    await putBoards("set-1", [{ boardId: "b1", name: "B1 Updated", obf }]);

    sets = await listBoardSets();
    expect(sets[0].boardCount).toBe(1);
  });

  test("counts multiple boards correctly", async () => {
    await upsertBoardSet(makeBoardSetInput());

    const boards = [
      { boardId: "b1", name: "B1", obf: makeOBFBoard({ id: "b1" }) },
      { boardId: "b2", name: "B2", obf: makeOBFBoard({ id: "b2" }) },
      { boardId: "b3", name: "B3", obf: makeOBFBoard({ id: "b3" }) },
    ];

    await putBoards("set-1", boards);

    const sets = await listBoardSets();
    expect(sets[0].boardCount).toBe(3);
  });

  test("returns undefined for nonexistent board", async () => {
    await upsertBoardSet(makeBoardSetInput());

    const board = await getBoard("set-1", "nonexistent");
    expect(board).toBeUndefined();
  });

  test("stores boards even when boardset record does not exist", async () => {
    const obf = makeOBFBoard({ id: "b1" });
    await putBoards("orphan-set", [{ boardId: "b1", name: "B1", obf }]);

    const board = await getBoard("orphan-set", "b1");
    expect(board).toBeDefined();
    expect(board!.boardId).toBe("b1");
  });

  test("rejects empty setId", async () => {
    await expect(
      putBoards("", [{ boardId: "b1", name: "B", obf: makeOBFBoard() }]),
    ).rejects.toThrow("Invalid setId");
  });
});

describe("putAssets and getAssetBlob", () => {
  test("stores and retrieves an asset blob", async () => {
    await upsertBoardSet(makeBoardSetInput());

    const blob = new Blob(["hello"], { type: "text/plain" });
    await putAssets("set-1", [
      { path: "images/logo.png", blob, mime: "image/png" },
    ]);

    const retrieved = await getAssetBlob("set-1", "images/logo.png");
    expect(retrieved).toBeInstanceOf(Blob);
    expect(await retrieved!.text()).toBe("hello");
  });

  test.each([
    { rawPath: "images\\photo.png", description: "backslashes" },
    { rawPath: "/images/photo.png", description: "leading slashes" },
    { rawPath: "images//photo.png", description: "double slashes" },
  ])(
    "normalizes $description so the asset is retrievable by canonical path",
    async ({ rawPath }) => {
      await upsertBoardSet(makeBoardSetInput());

      const blob = new Blob(["data"]);
      await putAssets("set-1", [{ path: rawPath, blob }]);

      const retrieved = await getAssetBlob("set-1", "images/photo.png");
      expect(retrieved).toBeInstanceOf(Blob);
      expect(await retrieved!.text()).toBe("data");
    },
  );

  test("returns undefined for nonexistent asset", async () => {
    await upsertBoardSet(makeBoardSetInput());

    const blob = await getAssetBlob("set-1", "nope.png");
    expect(blob).toBeUndefined();
  });

  test("stores asset size from blob when not explicitly provided", async () => {
    await upsertBoardSet(makeBoardSetInput());

    const blob = new Blob(["12345"]);
    await putAssets("set-1", [{ path: "file.bin", blob }]);

    const db = await getBoardsDB();
    const record = await db.get("assets", ["set-1", "file.bin"]);
    expect(record).toBeDefined();
    expect(record!.size).toBe(5);
  });
});

describe("updateBoardStrings", () => {
  test("adds localized strings to a board", async () => {
    await upsertBoardSet(makeBoardSetInput());

    const obf = makeOBFBoard({ id: "b1" });
    await putBoards("set-1", [{ boardId: "b1", name: "B1", obf }]);

    await updateBoardStrings("set-1", "b1", "es", {
      hello: "hola",
      world: "mundo",
    });

    const board = await getBoard("set-1", "b1");
    expect(board!.obf.strings).toEqual({
      es: { hello: "hola", world: "mundo" },
    });
  });

  test("preserves existing locale strings when adding a new locale", async () => {
    await upsertBoardSet(makeBoardSetInput());

    const obf = makeOBFBoard({
      id: "b1",
      strings: { fr: { hello: "bonjour" } },
    });
    await putBoards("set-1", [{ boardId: "b1", name: "B1", obf }]);

    await updateBoardStrings("set-1", "b1", "es", { hello: "hola" });

    const board = await getBoard("set-1", "b1");
    expect(board!.obf.strings).toEqual({
      fr: { hello: "bonjour" },
      es: { hello: "hola" },
    });
  });

  test("replaces all strings when updating an existing locale", async () => {
    await upsertBoardSet(makeBoardSetInput());

    const obf = makeOBFBoard({ id: "b1" });
    await putBoards("set-1", [{ boardId: "b1", name: "B1", obf }]);

    await updateBoardStrings("set-1", "b1", "es", {
      hello: "hola",
      bye: "adiós",
    });
    await updateBoardStrings("set-1", "b1", "es", { hello: "ey" });

    const board = await getBoard("set-1", "b1");
    expect(board!.obf.strings).toEqual({ es: { hello: "ey" } });
  });

  test("throws when board does not exist", async () => {
    await upsertBoardSet(makeBoardSetInput());

    await expect(
      updateBoardStrings("set-1", "nonexistent", "es", {}),
    ).rejects.toThrow("Board not found");
  });
});

describe("deleteBoardSetRecord", () => {
  test("removes the board set record", async () => {
    await upsertBoardSet(makeBoardSetInput());

    await deleteBoardSetRecord("set-1");

    const sets = await listBoardSets();
    expect(sets).toHaveLength(0);
  });

  test("cascade-deletes all boards in the set", async () => {
    await upsertBoardSet(makeBoardSetInput());

    await putBoards("set-1", [
      { boardId: "b1", name: "B1", obf: makeOBFBoard({ id: "b1" }) },
      { boardId: "b2", name: "B2", obf: makeOBFBoard({ id: "b2" }) },
    ]);

    await deleteBoardSetRecord("set-1");

    expect(await getBoard("set-1", "b1")).toBeUndefined();
    expect(await getBoard("set-1", "b2")).toBeUndefined();
  });

  test("cascade-deletes all assets in the set", async () => {
    await upsertBoardSet(makeBoardSetInput());

    await putAssets("set-1", [
      { path: "img1.png", blob: new Blob(["a"]) },
      { path: "img2.png", blob: new Blob(["b"]) },
    ]);

    await deleteBoardSetRecord("set-1");

    expect(await getAssetBlob("set-1", "img1.png")).toBeUndefined();
    expect(await getAssetBlob("set-1", "img2.png")).toBeUndefined();
  });

  test("does not affect other board sets", async () => {
    await upsertBoardSet(makeBoardSetInput({ name: "Set 1" }));
    await upsertBoardSet(makeBoardSetInput({ setId: "set-2", name: "Set 2" }));

    await putBoards("set-1", [
      { boardId: "b1", name: "B1", obf: makeOBFBoard({ id: "b1" }) },
    ]);
    await putBoards("set-2", [
      { boardId: "b2", name: "B2", obf: makeOBFBoard({ id: "b2" }) },
    ]);

    await deleteBoardSetRecord("set-1");

    const sets = await listBoardSets();
    expect(sets).toHaveLength(1);
    expect(sets[0].setId).toBe("set-2");

    const board = await getBoard("set-2", "b2");
    expect(board).toBeDefined();
  });

  test("rejects empty setId", async () => {
    await expect(deleteBoardSetRecord("")).rejects.toThrow("Invalid setId");
  });
});

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

    await upsertBoardSet(makeBoardSetInput({ name: "Persisted" }));
    const sets = await listBoardSets();
    expect(sets.map((set) => set.name)).toContain("Persisted");
  });
});
