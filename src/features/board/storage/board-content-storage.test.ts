import { assertDefined } from "@shared/testing/assert-defined";
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
  deleteBoardSet,
  type BoardSetCreateInput,
} from "./board-set-storage";
import { closeBoardsDB } from "./boards-db";

function makeBoardSetInput(
  overrides: Partial<BoardSetCreateInput> = {},
): BoardSetCreateInput {
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

describe("getBoard", () => {
  test("returns undefined for nonexistent board", async () => {
    await createBoardSet(makeBoardSetInput());

    const board = await getBoard("set-1", "nonexistent");
    expect(board).toBeUndefined();
  });
});

describe("listBoards", () => {
  test("returns only the set's boards", async () => {
    await createBoardSet(
      makeBoardSetInput({
        boardSet: { setId: "set-1", name: "Set 1", rootBoardId: "a" },
        boards: [
          { boardId: "a", name: "A", obf: makeOBFBoard({ id: "a" }) },
          { boardId: "b", name: "B", obf: makeOBFBoard({ id: "b" }) },
        ],
      }),
    );
    await createBoardSet(
      makeBoardSetInput({
        boardSet: { setId: "set-2", name: "Set 2", rootBoardId: "c" },
        boards: [{ boardId: "c", name: "C", obf: makeOBFBoard({ id: "c" }) }],
      }),
    );

    const boards = await listBoards("set-1");

    expect(boards.map((board) => board.boardId).sort()).toEqual(["a", "b"]);
  });

  test("returns empty array for a set with no boards", async () => {
    await createBoardSet(makeBoardSetInput());

    const boards = await listBoards("set-1");

    expect(boards).toEqual([]);
  });
});

describe("getAssetBlob", () => {
  test("retrieves asset blobs using normalized paths", async () => {
    await createBoardSet(
      makeBoardSetInput({
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
});

describe("updateBoardStrings", () => {
  test("old work cannot revive a deleted board or contaminate a replacement", async () => {
    const original = makeOBFBoard({
      id: "b1",
      name: "Food",
      strings: { en: { ":word": "eat" } },
    });
    const input = makeBoardSetInput({
      boards: [{ boardId: "b1", name: "Food", obf: original }],
    });
    await createBoardSet(input);
    await deleteBoardSet("set-1");
    await expect(
      updateBoardStrings("set-1", "b1", "es", { Food: "Comida" }, original),
    ).rejects.toThrow("Board not found");
    expect(await getBoard("set-1", "b1")).toBeUndefined();

    const replacement = { ...original, strings: { en: { ":word": "drink" } } };
    await createBoardSet(
      makeBoardSetInput({
        boards: [{ boardId: "b1", name: "Food", obf: replacement }],
      }),
    );
    await updateBoardStrings(
      "set-1",
      "b1",
      "es",
      { ":word": "comer" },
      original,
    );
    expect((await getBoard("set-1", "b1"))?.obf.strings).toEqual(
      replacement.strings,
    );

    await updateBoardStrings(
      "set-1",
      "b1",
      "es",
      { Food: "Comida" },
      { ...replacement, name: "Different source" },
    );
    expect((await getBoard("set-1", "b1"))?.obf.strings).toEqual(
      replacement.strings,
    );
  });

  test("source checks permit overlapping cache additions and reload retains both", async () => {
    const original = makeOBFBoard({ id: "b1", name: "Food" });
    await createBoardSet(
      makeBoardSetInput({
        boards: [{ boardId: "b1", name: "Food", obf: original }],
      }),
    );
    await Promise.all([
      updateBoardStrings("set-1", "b1", "es", { Food: "Comida" }, original),
      updateBoardStrings("set-1", "b1", "es", { eat: "comer" }, original),
    ]);
    await closeBoardsDB();
    expect((await getBoard("set-1", "b1"))?.obf.strings).toEqual({
      es: { Food: "Comida", eat: "comer" },
    });
  });
  test("adds localized strings to a board", async () => {
    const obf = makeOBFBoard({ id: "b1" });
    await createBoardSet(
      makeBoardSetInput({
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
    await createBoardSet(
      makeBoardSetInput({
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

  test("merges concurrent same-locale writes and preserves existing entries", async () => {
    const obf = makeOBFBoard({ id: "b1" });
    await createBoardSet(
      makeBoardSetInput({
        boards: [{ boardId: "b1", name: "B1", obf }],
      }),
    );

    await updateBoardStrings("set-1", "b1", "es", {
      hello: "hola",
      bye: "adiós",
    });
    await Promise.all([
      updateBoardStrings("set-1", "b1", "es", { hello: "ey", Food: "Comida" }),
      updateBoardStrings("set-1", "b1", "es", { eat: "comer" }),
    ]);

    const board = await getBoard("set-1", "b1");
    assertDefined(board);
    expect(board.obf.strings).toEqual({
      es: { hello: "hola", bye: "adiós", Food: "Comida", eat: "comer" },
    });
  });

  test("throws when board does not exist", async () => {
    await createBoardSet(makeBoardSetInput());

    await expect(
      updateBoardStrings("set-1", "nonexistent", "es", {}),
    ).rejects.toThrow("Board not found");
  });
});
