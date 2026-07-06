import type { OBFBoard } from "@shayc/open-board-format";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { assertDefined } from "@shared/testing/assert-defined";
import {
  closeBoardsDB,
  deleteBoardSetRows,
  getAssetBlob,
  getBoard,
  getBoardsDB,
  InvalidIdError,
  listBoards,
  listBoardSets,
  replaceBoardSet,
  updateBoardStrings,
  type ReplaceBoardSetInput,
} from "./boards-db";
import { makeOBFBoard, resetBoardsDB } from "../testing";

function makeReplaceInput(
  overrides: Partial<ReplaceBoardSetInput> = {},
): ReplaceBoardSetInput {
  return {
    boardSet: { setId: "set-1", name: "Set", rootBoardId: "root-1" },
    boards: [],
    assets: [],
    ...overrides,
  };
}

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

describe("replaceBoardSet", () => {
  test("inserts a new board set", async () => {
    const { replacedExisting } = await replaceBoardSet(
      makeReplaceInput({
        boardSet: { setId: "set-1", name: "My Set", rootBoardId: "root-1" },
      }),
    );

    expect(replacedExisting).toBe(false);

    const sets = await listBoardSets();
    expect(sets).toHaveLength(1);
    expect(sets[0].setId).toBe("set-1");
    expect(sets[0].name).toBe("My Set");
    expect(sets[0].boardCount).toBe(0);
  });

  test("counts boards from the boards array, not a recount", async () => {
    const boards = [
      { boardId: "b1", name: "B1", obf: makeOBFBoard({ id: "b1" }) },
      { boardId: "b2", name: "B2", obf: makeOBFBoard({ id: "b2" }) },
      { boardId: "b3", name: "B3", obf: makeOBFBoard({ id: "b3" }) },
    ];

    await replaceBoardSet(makeReplaceInput({ boards }));

    const sets = await listBoardSets();
    expect(sets[0].boardCount).toBe(3);

    const board = await getBoard("set-1", "b2");
    assertDefined(board);
    expect(board.name).toBe("B2");
  });

  test("stores and retrieves asset blobs, normalizing paths", async () => {
    await replaceBoardSet(
      makeReplaceInput({
        assets: [
          { path: "images\\photo.png", blob: new Blob(["data"]) },
          { path: "/leading.png", blob: new Blob(["a"]) },
          { path: "double//slash.png", blob: new Blob(["b"]) },
        ],
      }),
    );

    const retrieved = await getAssetBlob("set-1", "images/photo.png");
    expect(retrieved).toBeInstanceOf(Blob);
    assertDefined(retrieved);
    expect(await retrieved.text()).toBe("data");

    expect(await getAssetBlob("set-1", "leading.png")).toBeInstanceOf(Blob);
    expect(await getAssetBlob("set-1", "double/slash.png")).toBeInstanceOf(
      Blob,
    );
  });

  test("replaces an existing set wholesale: dropped boards, assets and metadata are gone", async () => {
    await replaceBoardSet(
      makeReplaceInput({
        boardSet: {
          setId: "set-1",
          name: "Set v1",
          rootBoardId: "a",
          author: "Alice",
        },
        boards: [
          { boardId: "a", name: "A", obf: makeOBFBoard({ id: "a" }) },
          { boardId: "b", name: "B", obf: makeOBFBoard({ id: "b" }) },
        ],
        assets: [
          { path: "x.png", blob: new Blob(["x"]) },
          { path: "y.png", blob: new Blob(["y"]) },
        ],
      }),
    );

    const { replacedExisting } = await replaceBoardSet(
      makeReplaceInput({
        boardSet: { setId: "set-1", name: "Set v2", rootBoardId: "a" },
        boards: [{ boardId: "a", name: "A", obf: makeOBFBoard({ id: "a" }) }],
        assets: [{ path: "x.png", blob: new Blob(["x"]) }],
      }),
    );

    expect(replacedExisting).toBe(true);

    const sets = await listBoardSets();
    expect(sets).toHaveLength(1);
    expect(sets[0].boardCount).toBe(1);
    expect(sets[0].author).toBeUndefined();
    expect(sets[0].rootBoardId).toBe("a");

    expect(await getBoard("set-1", "a")).toBeDefined();
    expect(await getBoard("set-1", "b")).toBeUndefined();
    expect(await getAssetBlob("set-1", "x.png")).toBeInstanceOf(Blob);
    expect(await getAssetBlob("set-1", "y.png")).toBeUndefined();
  });

  test("aborts the entire transaction when a board fails to clone, leaving the prior set intact", async () => {
    await replaceBoardSet(
      makeReplaceInput({
        boardSet: {
          setId: "set-1",
          name: "Set v1",
          rootBoardId: "a",
          author: "Alice",
        },
        boards: [{ boardId: "a", name: "A", obf: makeOBFBoard({ id: "a" }) }],
        assets: [{ path: "x.png", blob: new Blob(["x"]) }],
      }),
    );

    const uncloneableObf = {
      ...makeOBFBoard({ id: "b" }),
      onFail: () => "noop",
    } as unknown as OBFBoard;

    await expect(
      replaceBoardSet(
        makeReplaceInput({
          boardSet: { setId: "set-1", name: "Set v2", rootBoardId: "b" },
          boards: [{ boardId: "b", name: "B", obf: uncloneableObf }],
          assets: [],
        }),
      ),
    ).rejects.toThrow();

    const sets = await listBoardSets();
    expect(sets).toHaveLength(1);
    expect(sets[0].author).toBe("Alice");
    expect(sets[0].rootBoardId).toBe("a");
    expect(sets[0].boardCount).toBe(1);

    expect(await getBoard("set-1", "a")).toBeDefined();
    expect(await getAssetBlob("set-1", "x.png")).toBeInstanceOf(Blob);
  });

  test("rejects empty setId", async () => {
    await expect(
      replaceBoardSet(
        makeReplaceInput({
          boardSet: { setId: "", name: "Bad", rootBoardId: "root-1" },
        }),
      ),
    ).rejects.toThrow("Invalid setId");
  });

  test("rejects empty setId with a typed InvalidIdError", async () => {
    await expect(
      replaceBoardSet(
        makeReplaceInput({
          boardSet: { setId: "", name: "Bad", rootBoardId: "root-1" },
        }),
      ),
    ).rejects.toBeInstanceOf(InvalidIdError);
  });

  test("rejects setId longer than 255 characters", async () => {
    await expect(
      replaceBoardSet(
        makeReplaceInput({
          boardSet: {
            setId: "x".repeat(256),
            name: "Bad",
            rootBoardId: "root-1",
          },
        }),
      ),
    ).rejects.toThrow("Invalid setId");
  });

  test("rejects empty rootBoardId", async () => {
    await expect(
      replaceBoardSet(
        makeReplaceInput({
          boardSet: { setId: "set-1", name: "Bad", rootBoardId: "" },
        }),
      ),
    ).rejects.toThrow("Invalid rootBoardId");
  });

  test("rejects empty boardId", async () => {
    await expect(
      replaceBoardSet(
        makeReplaceInput({
          boards: [{ boardId: "", name: "B", obf: makeOBFBoard() }],
        }),
      ),
    ).rejects.toThrow("Invalid boardId");
  });

  test("rejects boardId longer than 255 characters", async () => {
    await expect(
      replaceBoardSet(
        makeReplaceInput({
          boards: [
            { boardId: "x".repeat(256), name: "B", obf: makeOBFBoard() },
          ],
        }),
      ),
    ).rejects.toThrow("Invalid boardId");
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

    await replaceBoardSet(
      makeReplaceInput({
        boardSet: { setId: "old", name: "Old", rootBoardId: "root-1" },
      }),
    );
    await replaceBoardSet(
      makeReplaceInput({
        boardSet: { setId: "new", name: "New", rootBoardId: "root-1" },
      }),
    );

    const sets = await listBoardSets();
    expect(sets).toHaveLength(2);
    expect(sets[0].setId).toBe("new");
    expect(sets[1].setId).toBe("old");
  });
});

describe("getBoard", () => {
  test("returns undefined for nonexistent board", async () => {
    await replaceBoardSet(makeReplaceInput());

    const board = await getBoard("set-1", "nonexistent");
    expect(board).toBeUndefined();
  });
});

describe("listBoards", () => {
  test("returns only the set's boards", async () => {
    await replaceBoardSet(
      makeReplaceInput({
        boardSet: { setId: "set-1", name: "Set 1", rootBoardId: "a" },
        boards: [
          { boardId: "a", name: "A", obf: makeOBFBoard({ id: "a" }) },
          { boardId: "b", name: "B", obf: makeOBFBoard({ id: "b" }) },
        ],
      }),
    );
    await replaceBoardSet(
      makeReplaceInput({
        boardSet: { setId: "set-2", name: "Set 2", rootBoardId: "c" },
        boards: [{ boardId: "c", name: "C", obf: makeOBFBoard({ id: "c" }) }],
      }),
    );

    const boards = await listBoards("set-1");

    expect(boards.map((board) => board.boardId).sort()).toEqual(["a", "b"]);
  });

  test("returns empty array for a set with no boards", async () => {
    await replaceBoardSet(makeReplaceInput());

    const boards = await listBoards("set-1");

    expect(boards).toEqual([]);
  });
});

describe("updateBoardStrings", () => {
  test("adds localized strings to a board", async () => {
    const obf = makeOBFBoard({ id: "b1" });
    await replaceBoardSet(
      makeReplaceInput({
        boards: [{ boardId: "b1", name: "B1", obf }],
      }),
    );

    await updateBoardStrings("set-1", "b1", "es", {
      hello: "hola",
      world: "mundo",
    });

    const board = await getBoard("set-1", "b1");
    assertDefined(board);
    expect(board.obf.strings).toEqual({
      es: { hello: "hola", world: "mundo" },
    });
  });

  test("preserves existing locale strings when adding a new locale", async () => {
    const obf = makeOBFBoard({
      id: "b1",
      strings: { fr: { hello: "bonjour" } },
    });
    await replaceBoardSet(
      makeReplaceInput({
        boards: [{ boardId: "b1", name: "B1", obf }],
      }),
    );

    await updateBoardStrings("set-1", "b1", "es", { hello: "hola" });

    const board = await getBoard("set-1", "b1");
    assertDefined(board);
    expect(board.obf.strings).toEqual({
      fr: { hello: "bonjour" },
      es: { hello: "hola" },
    });
  });

  test("replaces all strings when updating an existing locale", async () => {
    const obf = makeOBFBoard({ id: "b1" });
    await replaceBoardSet(
      makeReplaceInput({
        boards: [{ boardId: "b1", name: "B1", obf }],
      }),
    );

    await updateBoardStrings("set-1", "b1", "es", {
      hello: "hola",
      bye: "adiós",
    });
    await updateBoardStrings("set-1", "b1", "es", { hello: "ey" });

    const board = await getBoard("set-1", "b1");
    assertDefined(board);
    expect(board.obf.strings).toEqual({ es: { hello: "ey" } });
  });

  test("throws when board does not exist", async () => {
    await replaceBoardSet(makeReplaceInput());

    await expect(
      updateBoardStrings("set-1", "nonexistent", "es", {}),
    ).rejects.toThrow("Board not found");
  });
});

describe("deleteBoardSetRows", () => {
  test("removes the board set record", async () => {
    await replaceBoardSet(makeReplaceInput());

    await deleteBoardSetRows("set-1");

    const sets = await listBoardSets();
    expect(sets).toHaveLength(0);
  });

  test("cascade-deletes all boards in the set", async () => {
    await replaceBoardSet(
      makeReplaceInput({
        boards: [
          { boardId: "b1", name: "B1", obf: makeOBFBoard({ id: "b1" }) },
          { boardId: "b2", name: "B2", obf: makeOBFBoard({ id: "b2" }) },
        ],
      }),
    );

    await deleteBoardSetRows("set-1");

    expect(await getBoard("set-1", "b1")).toBeUndefined();
    expect(await getBoard("set-1", "b2")).toBeUndefined();
  });

  test("cascade-deletes all assets in the set", async () => {
    await replaceBoardSet(
      makeReplaceInput({
        assets: [
          { path: "img1.png", blob: new Blob(["a"]) },
          { path: "img2.png", blob: new Blob(["b"]) },
        ],
      }),
    );

    await deleteBoardSetRows("set-1");

    expect(await getAssetBlob("set-1", "img1.png")).toBeUndefined();
    expect(await getAssetBlob("set-1", "img2.png")).toBeUndefined();
  });

  test("does not affect other board sets", async () => {
    await replaceBoardSet(
      makeReplaceInput({
        boardSet: { setId: "set-1", name: "Set 1", rootBoardId: "root-1" },
        boards: [
          { boardId: "b1", name: "B1", obf: makeOBFBoard({ id: "b1" }) },
        ],
      }),
    );
    await replaceBoardSet(
      makeReplaceInput({
        boardSet: { setId: "set-2", name: "Set 2", rootBoardId: "root-1" },
        boards: [
          { boardId: "b2", name: "B2", obf: makeOBFBoard({ id: "b2" }) },
        ],
      }),
    );

    await deleteBoardSetRows("set-1");

    const sets = await listBoardSets();
    expect(sets).toHaveLength(1);
    expect(sets[0].setId).toBe("set-2");

    const board = await getBoard("set-2", "b2");
    expect(board).toBeDefined();
  });

  test("rejects empty setId", async () => {
    await expect(deleteBoardSetRows("")).rejects.toThrow("Invalid setId");
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

    await replaceBoardSet(
      makeReplaceInput({
        boardSet: { setId: "set-1", name: "Persisted", rootBoardId: "root-1" },
      }),
    );
    const sets = await listBoardSets();
    expect(sets.map((set) => set.name)).toContain("Persisted");
  });
});
