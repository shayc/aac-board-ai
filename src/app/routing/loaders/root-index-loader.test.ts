import { getBoardSets } from "@features/board";
import { resetBoardsDB, seedBoardSets } from "@features/board/testing";
import type { LoaderFunctionArgs } from "react-router";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { rootIndexLoader, type RootIndexData } from "./root-index-loader";

const FIXTURE_BOARD_URL =
  "/src/features/board/testing/sample-boards/lots-of-stuff.obz";
const DEFAULT_BOARD_PATH = "/quick-core-24.obz";

function callLoader(searchParams = ""): Promise<Response | RootIndexData> {
  const args = {
    request: new Request(`http://localhost/${searchParams}`),
    params: {},
  } as unknown as LoaderFunctionArgs;

  return rootIndexLoader(args);
}

async function callLoaderForRedirect(searchParams = ""): Promise<Response> {
  const result = await callLoader(searchParams);
  if (!(result instanceof Response)) {
    throw new Error("Expected the loader to return a redirect Response");
  }

  return result;
}

describe("rootIndexLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("imports the URL from ?board and redirects to its board route", async () => {
    const response = await callLoaderForRedirect(
      `?board=${encodeURIComponent(FIXTURE_BOARD_URL)}`,
    );

    expect(response.status).toBe(302);
    const location = response.headers.get("Location");
    expect(location).toMatch(/^\/sets\/[^/]+\/boards\/[^/]+$/);

    const sets = await getBoardSets();
    expect(sets).toHaveLength(1);
  });

  test("returns a pending-import intent instead of overwriting an existing set", async () => {
    await seedBoardSets([
      { setId: "lots-of-stuff", rootBoardId: "root-1", name: "My Vocabulary" },
    ]);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await callLoader(
      `?board=${encodeURIComponent(FIXTURE_BOARD_URL)}`,
    );

    expect(result).toEqual({
      pendingImport: {
        boardUrl: FIXTURE_BOARD_URL,
        boardSetName: "My Vocabulary",
      },
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("throws a localized 400 instead of fetching a non-http(s) board URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      callLoader(
        `?board=${encodeURIComponent("data:application/zip;base64,UEsDBA==")}`,
      ),
    ).rejects.toMatchObject({ init: { status: 400 } });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("throws a localized 400 when the board URL cannot be imported", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    await expect(
      callLoader(
        `?board=${encodeURIComponent("https://example.com/gone.obz")}`,
      ),
    ).rejects.toMatchObject({ init: { status: 400 } });
  });

  test("redirects to the root board of the most recently updated set when no param is given", async () => {
    await seedBoardSets([
      { setId: "set-1", rootBoardId: "root-1" },
      { setId: "set-2", rootBoardId: "root-2" },
    ]);

    const response = await callLoaderForRedirect();

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sets/set-2/boards/root-2");
  });

  test("imports the default board when no param is given and IDB is empty", async () => {
    const probe = await fetch(DEFAULT_BOARD_PATH);
    if (!probe.ok) {
      throw new Error(`Default board fixture missing at ${DEFAULT_BOARD_PATH}`);
    }

    const response = await callLoaderForRedirect();

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toMatch(
      /^\/sets\/[^/]+\/boards\/[^/]+$/,
    );

    const sets = await getBoardSets();
    expect(sets).toHaveLength(1);
  });
});
