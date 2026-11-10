import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/board/testing";
import { loaderArgs } from "@shared/testing/loader-args";
import { beforeEach, describe, expect, test } from "vitest";
import { boardSetLoader } from "./board-set-loader";

function callLoader(boardSetId: string | undefined) {
  return boardSetLoader(
    loaderArgs("http://localhost/", { params: { boardSetId } }),
  );
}

describe("boardSetLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("throws 404 when params are missing", async () => {
    await expect(callLoader(undefined)).rejects.toMatchObject({
      init: { status: 404 },
    });
  });

  test("returns a summary of each board in the set", async () => {
    await seedBoardSets([
      {
        id: "set-1",
        rootBoardId: "home",
        boards: [
          makeOBFBoard({ id: "home", name: "Home" }),
          makeOBFBoard({ id: "food", name: "Food" }),
        ],
      },
    ]);

    const { summaries } = await callLoader("set-1");

    const names = summaries.map(({ name }) => name);
    expect(new Set(names)).toEqual(new Set(["Food", "Home"]));
  });

  test("returns the set's root board", async () => {
    await seedBoardSets([{ id: "set-1", rootBoardId: "home" }]);

    const { rootBoardId } = await callLoader("set-1");

    expect(rootBoardId).toBe("home");
  });

  test("returns no root board for a set that isn't stored", async () => {
    const { rootBoardId, summaries } = await callLoader("missing");

    expect(rootBoardId).toBeUndefined();
    expect(summaries).toEqual([]);
  });
});
