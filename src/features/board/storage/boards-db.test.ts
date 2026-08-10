import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { resetBoardsDB } from "../testing";
import { closeBoardsDB, getBoardsDB } from "./boards-db";

beforeEach(async () => {
  await resetBoardsDB();
});

afterEach(closeBoardsDB);

describe("getBoardsDB", () => {
  test("reuses one connection across calls", async () => {
    const [first, second] = await Promise.all([getBoardsDB(), getBoardsDB()]);

    expect(first).toBe(second);
  });

  test("reopens a fresh, usable connection after closeBoardsDB", async () => {
    const first = await getBoardsDB();
    await closeBoardsDB();

    const second = await getBoardsDB();
    expect(second).not.toBe(first);

    await second.add("boardSets", {
      setId: "set-1",
      name: "Persisted",
      rootBoardId: "root-1",
      updatedAt: 1,
      boardCount: 0,
    });
    expect((await second.get("boardSets", "set-1"))?.name).toBe("Persisted");
  });
});
