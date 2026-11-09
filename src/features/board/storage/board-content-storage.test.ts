import { assertDefined } from "@shared/testing/assert-defined";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { makeBoardSetInput, makeOBFBoard, resetBoardsDB } from "../testing";
import {
  getAssetBlob,
  getBoardRecord,
  listBoardRecords,
  replaceStringTranslations,
} from "./board-content-storage";
import { insertBoardSet } from "./board-set-storage";
import { closeBoardsDB } from "./boards-db";

const BOARD_KEY = { boardSetId: "set-1", boardId: "b1" };

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

describe("getBoardRecord", () => {
  test("returns undefined for nonexistent board", async () => {
    await insertBoardSet(makeBoardSetInput());

    const board = await getBoardRecord({
      boardSetId: "set-1",
      boardId: "nonexistent",
    });
    expect(board).toBeUndefined();
  });
});

describe("listBoardRecords", () => {
  test("returns only the set's boards", async () => {
    await insertBoardSet(
      makeBoardSetInput({
        id: "set-1",
        name: "Set 1",
        rootBoardId: "a",
        boards: [
          makeOBFBoard({ id: "a", name: "A" }),
          makeOBFBoard({ id: "b", name: "B" }),
        ],
      }),
    );
    await insertBoardSet(
      makeBoardSetInput({
        id: "set-2",
        name: "Set 2",
        rootBoardId: "c",
        boards: [makeOBFBoard({ id: "c", name: "C" })],
      }),
    );

    const boards = await listBoardRecords("set-1");

    expect(boards.map((board) => board.id).sort()).toEqual(["a", "b"]);
  });

  test("returns empty array for a nonexistent set", async () => {
    const boards = await listBoardRecords("missing");

    expect(boards).toEqual([]);
  });
});

describe("getAssetBlob", () => {
  test("retrieves asset blobs using normalized paths", async () => {
    await insertBoardSet(
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

describe("replaceStringTranslations", () => {
  test("adds localized strings to a board", async () => {
    const obf = makeOBFBoard({ id: "b1", name: "B1" });
    await insertBoardSet(
      makeBoardSetInput({
        boards: [obf],
      }),
    );

    await replaceStringTranslations(
      BOARD_KEY,
      "es",
      new Map([
        ["hello", "hola"],
        ["world", "mundo"],
      ]),
    );

    const board = await getBoardRecord(BOARD_KEY);
    assertDefined(board);
    expect(board.obf.strings).toEqual({
      es: { hello: "hola", world: "mundo" },
    });
  });

  test("preserves existing locale strings when adding a new locale", async () => {
    const obf = makeOBFBoard({
      id: "b1",
      name: "B1",
      strings: { fr: { hello: "bonjour" } },
    });
    await insertBoardSet(
      makeBoardSetInput({
        boards: [obf],
      }),
    );

    await replaceStringTranslations(
      BOARD_KEY,
      "es",
      new Map([["hello", "hola"]]),
    );

    const board = await getBoardRecord(BOARD_KEY);
    assertDefined(board);
    expect(board.obf.strings).toEqual({
      fr: { hello: "bonjour" },
      es: { hello: "hola" },
    });
  });

  test("replaces all strings when updating an existing locale", async () => {
    const obf = makeOBFBoard({ id: "b1", name: "B1" });
    await insertBoardSet(
      makeBoardSetInput({
        boards: [obf],
      }),
    );

    await replaceStringTranslations(
      BOARD_KEY,
      "es",
      new Map([
        ["hello", "hola"],
        ["bye", "adiós"],
      ]),
    );
    await replaceStringTranslations(
      BOARD_KEY,
      "es",
      new Map([["hello", "ey"]]),
    );

    const board = await getBoardRecord(BOARD_KEY);
    assertDefined(board);
    expect(board.obf.strings).toEqual({ es: { hello: "ey" } });
  });

  test("throws when board does not exist", async () => {
    await insertBoardSet(makeBoardSetInput());

    await expect(
      replaceStringTranslations(
        { boardSetId: "set-1", boardId: "nonexistent" },
        "es",
        new Map(),
      ),
    ).rejects.toThrow("Board not found");
  });
});
