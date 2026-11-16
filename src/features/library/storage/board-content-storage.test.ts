import { assertDefined } from "@shared/testing/assert-defined";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
  makeAssetInput,
  makeBoardSetInput,
  makeOBFBoard,
  resetBoardsDB,
} from "../testing";
import {
  getAssetBlob,
  getBoardRecord,
  listBoardIds,
  listBoardRecords,
} from "./board-content-storage";
import { insertBoardSetRecords } from "./board-set-storage";
import { closeBoardsDB } from "./boards-db";

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

describe("getBoardRecord", () => {
  test("returns undefined for a missing board", async () => {
    await insertBoardSetRecords(makeBoardSetInput());

    const board = await getBoardRecord({
      boardSetId: "set-1",
      boardId: "nonexistent",
    });
    expect(board).toBeUndefined();
  });
});

describe("listBoardIds", () => {
  test("returns only the IDs of the board set's boards", async () => {
    await insertBoardSetRecords(
      makeBoardSetInput({
        id: "set-1",
        rootBoardId: "a",
        boards: [
          makeOBFBoard({ id: "a", name: "A" }),
          makeOBFBoard({ id: "b", name: "B" }),
        ],
      }),
    );
    await insertBoardSetRecords(
      makeBoardSetInput({
        id: "set-2",
        rootBoardId: "c",
        boards: [makeOBFBoard({ id: "c", name: "C" })],
      }),
    );

    const boardIds = await listBoardIds("set-1");

    expect(boardIds.sort()).toEqual(["a", "b"]);
  });
});

describe("listBoardRecords", () => {
  test("returns only the board set's boards", async () => {
    await insertBoardSetRecords(
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
    await insertBoardSetRecords(
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

  test("returns an empty array for a missing board set", async () => {
    const boards = await listBoardRecords("missing");

    expect(boards).toEqual([]);
  });
});

describe("getAssetBlob", () => {
  test("retrieves asset blobs using normalized paths", async () => {
    await insertBoardSetRecords(
      makeBoardSetInput({
        assets: [
          makeAssetInput("images\\photo.png", "data", "image/png"),
          makeAssetInput("/leading.png", "a"),
          makeAssetInput("double//slash.png", "b"),
        ],
      }),
    );

    const retrieved = await getAssetBlob("set-1", "images/photo.png");
    expect(retrieved).toBeInstanceOf(Blob);
    assertDefined(retrieved);
    expect(await retrieved.text()).toBe("data");
    expect(retrieved.type).toBe("image/png");

    expect(await getAssetBlob("set-1", "leading.png")).toBeInstanceOf(Blob);
    expect(await getAssetBlob("set-1", "double/slash.png")).toBeInstanceOf(
      Blob,
    );
  });
});
