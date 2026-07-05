import { resetBoardsDB, seedBoardSets } from "@features/board/testing";
import type { LoaderFunctionArgs } from "react-router";
import { beforeEach, describe, expect, test } from "vitest";
import { boardSetIndexLoader } from "./board-set-index-loader";

function callLoader(setId: string): Promise<Response> {
  const args = {
    request: new Request("http://localhost/"),
    params: { setId },
  } as unknown as LoaderFunctionArgs;

  return boardSetIndexLoader(args);
}

describe("boardSetIndexLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("redirects to the root board route on the happy path", async () => {
    await seedBoardSets([{ setId: "set-1", rootBoardId: "root-1" }]);

    const response = await callLoader("set-1");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sets/set-1/boards/root-1");
  });

  test("throws 404 when the board set is missing", async () => {
    await seedBoardSets([]);

    await expect(callLoader("missing-set")).rejects.toMatchObject({
      init: { status: 404 },
    });
  });

  test("throws 404 for an oversize setId", async () => {
    await seedBoardSets([]);

    await expect(callLoader("x".repeat(256))).rejects.toMatchObject({
      init: { status: 404 },
    });
  });
});
