import { getBoardSets } from "@features/board";
import { resetBoardsDB, seedBoardSets } from "@features/board/testing";
import type { LoaderFunctionArgs } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { rootIndexLoader, type RootIndexLoaderData } from "./root-index-loader";

const FIXTURE_BOARD_URL =
  "/src/features/board/testing/sample-boards/lots-of-stuff.obz";

function callLoader(
  searchParams = "",
): Promise<Response | RootIndexLoaderData> {
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

  test("returns the ?board URL for the page to import, without touching the DB", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await callLoader(
      `?board=${encodeURIComponent(FIXTURE_BOARD_URL)}`,
    );

    expect(result).toEqual({ importUrl: FIXTURE_BOARD_URL });
    expect(fetchSpy).not.toHaveBeenCalled();

    const sets = await getBoardSets();
    expect(sets).toHaveLength(0);
  });

  test("redirects to the root board of the most recently updated set when no param is given", async () => {
    await seedBoardSets([
      { setId: "set-1", rootBoardId: "root-1" },
      { setId: "set-2", rootBoardId: "root-2" },
    ]);

    const result = await callLoader();

    expect(result).toBeInstanceOf(Response);
    const response = result as Response;
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sets/set-2/boards/root-2");
  });

  test("returns the default board URL when no param is given and IDB is empty", async () => {
    const result = await callLoader();

    expect(result).not.toBeInstanceOf(Response);
    const { importUrl } = result as RootIndexLoaderData;
    expect(importUrl).toMatch(/quick-core-24\.obz$/);

    const sets = await getBoardSets();
    expect(sets).toHaveLength(0);
  });
});
