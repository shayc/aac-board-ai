import { resetBoardsDB, seedBoardSets } from "@features/library/testing";
import { loaderArgs } from "@shared/testing/loader-args";
import { beforeEach, describe, expect, test } from "vitest";
import { boardSetIndexLoader } from "./board-set-index-loader";

function callLoader(boardSetId: string): Promise<Response> {
  return boardSetIndexLoader(
    loaderArgs("http://localhost/", { params: { boardSetId } }),
  );
}

describe("boardSetIndexLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("redirects to the board set's root board", async () => {
    await seedBoardSets([{ id: "set-1", rootBoardId: "root-1" }]);

    const response = await callLoader("set-1");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sets/set-1/boards/root-1");
  });

  test("throws 404 when the board set is missing", async () => {
    await expect(callLoader("missing-set")).rejects.toMatchObject({
      init: { status: 404 },
    });
  });
});
