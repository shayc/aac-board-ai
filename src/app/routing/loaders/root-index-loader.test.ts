import { getBoardSets } from "@features/board";
import { resetBoardsDB, seedBoardSets } from "@features/board/testing";
import type { LoaderFunctionArgs } from "react-router";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { routeErrorCodes } from "../route-error";
import { rootIndexLoader } from "./root-index-loader";

const FIXTURE_BOARD_URL =
  "/src/features/board/testing/sample-boards/lots-of-stuff.obz";
const DEFAULT_BOARD_PATH = "/quick-core-24.obz";
const localizedImportFailure = {
  data: { code: routeErrorCodes.boardUrlImportFailed },
  init: { status: 400 },
};

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

  afterEach(() => {
    vi.restoreAllMocks();
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

  test("keeps the existing set when a URL import has the same filename", async () => {
    await seedBoardSets([
      { setId: "lots-of-stuff", rootBoardId: "root-1", name: "My Vocabulary" },
    ]);

    const response = await callLoader(
      `?board=${encodeURIComponent(FIXTURE_BOARD_URL)}`,
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toMatch(
      /^\/sets\/lots-of-stuff-2\/boards\/[^/]+$/,
    );
    expect(new Set((await getBoardSets()).map((set) => set.setId))).toEqual(
      new Set(["lots-of-stuff-2", "lots-of-stuff"]),
    );
  });

  test("throws a localized 400 instead of fetching a non-http(s) board URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      callLoader(
        `?board=${encodeURIComponent("data:application/zip;base64,UEsDBA==")}`,
      ),
    ).rejects.toMatchObject(localizedImportFailure);

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
    ).rejects.toMatchObject(localizedImportFailure);
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
