import type { Board } from "@features/library";
import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/library/testing";
import { loaderArgs } from "@shared/testing/loader-args";
import { beforeEach, describe, expect, test } from "vitest";
import { boardLoader } from "./board-loader";

function callLoader(
  boardSetId: string | undefined,
  boardId: string | undefined,
): Promise<Board> {
  return boardLoader(
    loaderArgs("http://localhost/", { params: { boardSetId, boardId } }),
  );
}

describe("boardLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("throws 404 when params are missing", async () => {
    await expect(callLoader(undefined, undefined)).rejects.toMatchObject({
      init: { status: 404 },
    });
  });

  test("throws 404 when the board does not exist", async () => {
    await expect(callLoader("set-1", "missing-board")).rejects.toMatchObject({
      init: { status: 404 },
    });
  });

  test("returns the stored board", async () => {
    await seedBoardSets([
      {
        id: "set-1",
        rootBoardId: "root-1",
        boards: [makeOBFBoard({ id: "root-1", name: "Home" })],
      },
    ]);

    const board = await callLoader("set-1", "root-1");

    expect(board).toMatchObject({ id: "root-1", name: "Home" });
  });
});
