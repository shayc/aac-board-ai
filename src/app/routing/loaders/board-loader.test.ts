import { resetBoardsDB } from "@features/board/testing";
import type { LoaderFunctionArgs } from "react-router";
import { beforeEach, describe, expect, test } from "vitest";
import { boardLoader } from "./board-loader";

function callLoader(setId: string, boardId: string): Promise<unknown> {
  const args = {
    request: new Request("http://localhost/"),
    params: { setId, boardId },
  } as unknown as LoaderFunctionArgs;

  return boardLoader(args);
}

describe("boardLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
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
});
