import { afterEach, beforeEach, expect, test } from "vitest";
import { closeBoardsDB, getBoardsDB } from "../storage/boards-db";
import { resetBoardsDB } from "../testing";
import {
  getBoardSets,
  getBoardSetsSnapshot,
  refreshBoardSets,
} from "./board-sets-store";

beforeEach(resetBoardsDB);
afterEach(async () => {
  await closeBoardsDB();
  await refreshBoardSets();
});

test("imperative catalog reads distinguish a failed read from an empty library", async () => {
  expect(await getBoardSets()).toEqual([]);
  const db = await getBoardsDB();
  db.close();
  await refreshBoardSets();

  expect(getBoardSetsSnapshot().error).toBeInstanceOf(Error);
  await expect(getBoardSets()).rejects.toMatchObject({
    name: "InvalidStateError",
  });

  await closeBoardsDB();
  await refreshBoardSets();
  expect(await getBoardSets()).toEqual([]);
});
