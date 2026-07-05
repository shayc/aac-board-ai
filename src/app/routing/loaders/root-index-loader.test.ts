import { beforeEach, describe, expect, test } from "vitest";
import type { LoaderFunctionArgs } from "react-router";
import { getBoardSets } from "@features/board";
import { resetBoardsDB, seedBoardSets } from "@features/board/testing";
import { rootIndexLoader } from "./root-index-loader";

const FIXTURE_BOARD_URL =
  "/src/features/board/testing/sample-boards/lots-of-stuff.obz";
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
  });

  test("imports the URL from ?board and redirects to its board route", async () => {
    const response = await callLoader(
      `?board=${encodeURIComponent(FIXTURE_BOARD_URL)}`,
    );

    expect(response.status).toBe(302);
    const location = response.headers.get("Location");
    expect(location).toMatch(/^\/sets\/[^/]+\/boards\/[^/]+$/);

    const sets = await getBoardSets();
    expect(sets).toHaveLength(1);
  });

  test("redirects to the root board of the most recently updated set when no param is given", async () => {
    await seedBoardSets([
      { setId: "set-1", rootBoardId: "root-1" },
      { setId: "set-2", rootBoardId: "root-2" },
    ]);

    const response = await callLoader();

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sets/set-2/boards/root-2");
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

    const sets = await getBoardSets();
    expect(sets).toHaveLength(1);
  });
});
