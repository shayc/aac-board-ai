import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/board/testing";
import {
  listBoardSets,
  rememberBoardSet,
  selectLaunchBoardSet,
  type Board,
} from "@features/board";
import type { LoaderFunctionArgs } from "react-router";
import { beforeEach, describe, expect, test } from "vitest";
import { boardLoader } from "./board-loader";

function callLoader(
  boardSetId: string | undefined,
  boardId: string | undefined,
): Promise<Board> {
  const args = {
    request: new Request("http://localhost/"),
    params: { boardSetId, boardId },
  } as unknown as LoaderFunctionArgs;

  return boardLoader(args);
}

async function seedLaunchCandidates() {
  await seedBoardSets([
    {
      id: "set-1",
      rootBoardId: "root-1",
      boards: [makeOBFBoard({ id: "root-1" })],
    },
    {
      id: "set-2",
      rootBoardId: "root-2",
      boards: [makeOBFBoard({ id: "root-2" })],
    },
  ]);

  return listBoardSets();
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

  test("throws 404 for an oversize boardId", async () => {
    await expect(callLoader("set-1", "x".repeat(256))).rejects.toMatchObject({
      init: { status: 404 },
    });
  });

  test("throws 404 when the board does not exist", async () => {
    await expect(callLoader("set-1", "missing-board")).rejects.toMatchObject({
      init: { status: 404 },
    });
  });

  test("returns the stored board on the happy path", async () => {
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

  test("remembers the set of a loaded board for the next launch", async () => {
    const boardSets = await seedLaunchCandidates();

    await callLoader("set-2", "root-2");

    expect(selectLaunchBoardSet(boardSets)?.id).toBe("set-2");
  });

  test("does not remember a set whose board failed to load", async () => {
    const boardSets = await seedLaunchCandidates();
    rememberBoardSet("set-1");

    await expect(callLoader("set-2", "missing")).rejects.toMatchObject({
      init: { status: 404 },
    });

    expect(selectLaunchBoardSet(boardSets)?.id).toBe("set-1");
  });
});
