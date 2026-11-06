import { assertDefined } from "@shared/testing/assert-defined";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { makeBoardSetInput, makeOBFBoard, resetBoardsDB } from "../testing";
import {
  getAssetBlob,
  getBoardRecord,
  listBoardRecords,
  replaceBoardTranslations,
} from "./board-content-storage";
import { createBoardSetRecords } from "./board-set-storage";
import { closeBoardsDB } from "./boards-db";

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

describe("getBoardRecord", () => {
  test("returns undefined for nonexistent board", async () => {
    await createBoardSetRecords(makeBoardSetInput());

    const board = await getBoardRecord("set-1", "nonexistent");
    expect(board).toBeUndefined();
  });
});

describe("listBoardRecords", () => {
  test("returns only the set's boards", async () => {
    await createBoardSetRecords(
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
    await createBoardSetRecords(
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
    await createBoardSetRecords(
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

describe("replaceBoardTranslations", () => {
  test("adds localized strings to a board", async () => {
    const obf = makeOBFBoard({ id: "b1", name: "B1" });
    await createBoardSetRecords(
      makeBoardSetInput({
        boards: [obf],
      }),
    );

    await replaceBoardTranslations("set-1", "b1", "es", {
      hello: "hola",
      world: "mundo",
    });

    const board = await getBoardRecord("set-1", "b1");
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
    await createBoardSetRecords(
      makeBoardSetInput({
        boards: [obf],
      }),
    );

    await replaceBoardTranslations("set-1", "b1", "es", { hello: "hola" });

    const board = await getBoardRecord("set-1", "b1");
    assertDefined(board);
    expect(board.obf.strings).toEqual({
      fr: { hello: "bonjour" },
      es: { hello: "hola" },
    });
  });

  test("replaces all strings when updating an existing locale", async () => {
    const obf = makeOBFBoard({ id: "b1", name: "B1" });
    await createBoardSetRecords(
      makeBoardSetInput({
        boards: [obf],
      }),
    );

    await replaceBoardTranslations("set-1", "b1", "es", {
      hello: "hola",
      bye: "adiós",
    });
    await replaceBoardTranslations("set-1", "b1", "es", { hello: "ey" });

    const board = await getBoardRecord("set-1", "b1");
    assertDefined(board);
    expect(board.obf.strings).toEqual({ es: { hello: "ey" } });
  });

  test("throws when board does not exist", async () => {
    await createBoardSetRecords(makeBoardSetInput());

    await expect(
      replaceBoardTranslations("set-1", "nonexistent", "es", {}),
    ).rejects.toThrow("Board not found");
  });
});
