import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { LoaderFunctionArgs } from "react-router";
import { invalidateBoardSets } from "@features/board/storage/board-sets-store";
import { listBoardSets, withBoardsDB } from "@features/board/storage/boards-db";
import {
  resetBoardsDB,
  seedBoardSets,
} from "@features/board/storage/test-helpers";
import { rootIndexLoader } from "./root-index-loader";

const FIXTURE_BOARD_URL = "/src/shared/testing/sample-boards/lots_of_stuff.obz";
const DEFAULT_BOARD_PATH = "/quick-core-24.obz";

function callLoader(searchParams = ""): Promise<Response> {
  const args = {
    request: new Request(`http://localhost/${searchParams}`),
    params: {},
  } as unknown as LoaderFunctionArgs;
  return rootIndexLoader(args);
}

describe("rootIndexLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
    // resetBoardsDB clears IDB but the board-sets-store keeps its cached
    // snapshot from prior tests — explicitly invalidate so getBoardSets()
    // reads fresh from the now-empty DB.
    await invalidateBoardSets();
  });

  afterEach(async () => {
    await resetBoardsDB();
  });

  test("imports the URL from ?board and redirects to its board route", async () => {
    const response = await callLoader(
      `?board=${encodeURIComponent(FIXTURE_BOARD_URL)}`,
    );

    expect(response.status).toBe(302);
    const location = response.headers.get("Location");
    expect(location).toMatch(/^\/sets\/[^/]+\/boards\/[^/]+$/);

    const sets = await withBoardsDB((db) => listBoardSets(db));
    expect(sets).toHaveLength(1);
  });

  test("redirects to the root board of the most recently updated set when no param is given", async () => {
    // seedBoardSets inserts sequentially; listBoardSets orders by updatedAt
    // descending, so set-2 (inserted last) ends up first.
    await seedBoardSets([
      { setId: "set-1", rootBoardId: "root-1" },
      { setId: "set-2", rootBoardId: "root-2" },
    ]);

    const response = await callLoader();

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sets/set-2/boards/root-2");
  });

  test("skips sets without a rootBoardId and falls through to the default board", async () => {
    const probe = await fetch(DEFAULT_BOARD_PATH);
    if (!probe.ok) {
      throw new Error(`Default board fixture missing at ${DEFAULT_BOARD_PATH}`);
    }

    await seedBoardSets([{ setId: "set-broken" }]);

    const response = await callLoader();

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toMatch(
      /^\/sets\/[^/]+\/boards\/[^/]+$/,
    );
  });

  test("imports the default board when no param is given and IDB is empty", async () => {
    const probe = await fetch(DEFAULT_BOARD_PATH);
    if (!probe.ok) {
      throw new Error(`Default board fixture missing at ${DEFAULT_BOARD_PATH}`);
    }

    const response = await callLoader();

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toMatch(
      /^\/sets\/[^/]+\/boards\/[^/]+$/,
    );

    const sets = await withBoardsDB((db) => listBoardSets(db));
    expect(sets).toHaveLength(1);
  });
});
