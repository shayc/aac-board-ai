import { listBoardSets } from "@features/board";
import { resetBoardsDB, seedBoardSets } from "@features/board/testing";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { routeErrorCodes } from "../route-error";
import { rootIndexAction, rootIndexLoader } from "./root-index-loader";

const FIXTURE_BOARD_URL =
  "/src/features/board/testing/sample-boards/lots-of-stuff.obz";
const DEFAULT_BOARD_PATH = "/quick-core-24.obz";
const localizedImportFailure = {
  data: { code: routeErrorCodes.boardUrlImportFailed },
  init: { status: 400 },
};

function callLoader(searchParams = "", signal?: AbortSignal) {
  const args = {
    request: new Request(`http://localhost/${searchParams}`, { signal }),
    params: {},
  } as unknown as LoaderFunctionArgs;

  return rootIndexLoader(args);
}

function callAction(
  searchParams = "",
  signal?: AbortSignal,
): Promise<Response> {
  const args = {
    request: new Request(`http://localhost/${searchParams}`, {
      method: "POST",
      signal,
    }),
    params: {},
  } as unknown as ActionFunctionArgs;

  return rootIndexAction(args);
}

describe("rootIndexLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("asks before importing the URL from ?board", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await callLoader(
      `?board=${encodeURIComponent("https://boards.example.com/core.obz")}`,
    );

    expect(result).toEqual({ boardUrlHost: "boards.example.com" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await listBoardSets()).toEqual([]);
  });

  test("names the site of a board URL shared without a scheme", async () => {
    const result = await callLoader(
      `?board=${encodeURIComponent("www.example.com/core.obz")}`,
    );

    expect(result).toEqual({ boardUrlHost: "www.example.com" });
  });

  test("names the site and port of a board URL shared without a scheme", async () => {
    const result = await callLoader(
      `?board=${encodeURIComponent("boards.example.com:8443/core.obz")}`,
    );

    expect(result).toEqual({ boardUrlHost: "boards.example.com:8443" });
  });

  test("throws a localized 400 instead of asking about a non-http(s) board URL", async () => {
    await expect(
      callLoader(
        `?board=${encodeURIComponent("data:application/zip;base64,UEsDBA==")}`,
      ),
    ).rejects.toMatchObject(localizedImportFailure);
  });

  test("preserves navigation cancellation for the starter import", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(callLoader("", controller.signal)).rejects.toBe(
      controller.signal.reason,
    );
    expect(await listBoardSets()).toEqual([]);
  });

  test("redirects to the root board of the most recently updated set when no param is given", async () => {
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => (now += 1000));

    await seedBoardSets([
      { id: "set-1", rootBoardId: "root-1" },
      { id: "set-2", rootBoardId: "root-2" },
    ]);

    const response = (await callLoader()) as Response;

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sets/set-2/boards/root-2");
  });

  test("imports the default board when no param is given and IDB is empty", async () => {
    const probe = await fetch(DEFAULT_BOARD_PATH);
    if (!probe.ok) {
      throw new Error(`Default board fixture missing at ${DEFAULT_BOARD_PATH}`);
    }

    const response = (await callLoader()) as Response;

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toMatch(
      /^\/sets\/[^/]+\/boards\/[^/]+$/,
    );

    const sets = await listBoardSets();
    expect(sets).toHaveLength(1);
  });
});

describe("rootIndexAction", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("imports the URL from ?board and redirects to its board route", async () => {
    const response = await callAction(
      `?board=${encodeURIComponent(FIXTURE_BOARD_URL)}`,
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toMatch(
      /^\/sets\/[^/]+\/boards\/[^/]+$/,
    );
    expect(await listBoardSets()).toHaveLength(1);
  });

  test("keeps the existing set when a URL import has the same filename", async () => {
    await seedBoardSets([
      { id: "lots-of-stuff", rootBoardId: "root-1", name: "My Vocabulary" },
    ]);

    const response = await callAction(
      `?board=${encodeURIComponent(FIXTURE_BOARD_URL)}`,
    );

    expect(response.headers.get("Location")).toMatch(
      /^\/sets\/lots-of-stuff-2\/boards\/[^/]+$/,
    );
    expect(new Set((await listBoardSets()).map((set) => set.id))).toEqual(
      new Set(["lots-of-stuff-2", "lots-of-stuff"]),
    );
  });

  test("throws a localized 400 instead of fetching a non-http(s) board URL", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      callAction(
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
      callAction(
        `?board=${encodeURIComponent("https://example.com/gone.obz")}`,
      ),
    ).rejects.toMatchObject(localizedImportFailure);
  });

  test("preserves navigation cancellation", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      callAction(
        `?board=${encodeURIComponent(FIXTURE_BOARD_URL)}`,
        controller.signal,
      ),
    ).rejects.toBe(controller.signal.reason);
    expect(await listBoardSets()).toEqual([]);
  });

  test("redirects home when no board URL is given", async () => {
    const response = await callAction();

    expect(response.headers.get("Location")).toBe("/");
  });
});
