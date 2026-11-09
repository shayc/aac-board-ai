import { listBoardSetRecords } from "@features/board";
import {
  makeBoardsDBUnreadable,
  resetBoardsDB,
  seedBoardSets,
} from "@features/board/testing";
import { loaderArgs } from "@shared/testing/loader-args";
import {
  assert,
  beforeEach,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from "vitest";
import { routeErrorCodes } from "../route-error";
import { rootIndexAction, rootIndexLoader } from "./root-index-loader";

const FIXTURE_BOARD_URL =
  "/src/features/board/testing/sample-boards/lots-of-stuff.obz";
const DEFAULT_BOARD_PATH = "/first-words.obz";
const localizedImportFailure = {
  data: { code: routeErrorCodes.boardURLImportFailed },
  init: { status: 400 },
};

function callLoader(searchParams = "", signal?: AbortSignal) {
  return rootIndexLoader(
    loaderArgs(`http://localhost/${searchParams}`, { signal }),
  );
}

function callAction(
  searchParams = "",
  signal?: AbortSignal,
): Promise<Response> {
  return rootIndexAction(
    loaderArgs(`http://localhost/${searchParams}`, { signal }),
  );
}

describe("rootIndexLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("asks for confirmation instead of importing the URL from ?board", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      callLoader(
        `?board=${encodeURIComponent("https://boards.example/core.obz")}`,
      ),
    ).resolves.toEqual({ boardHost: "boards.example" });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("throws a localized 400 for a non-http(s) board URL before asking", async () => {
    await expect(
      callLoader(
        `?board=${encodeURIComponent("data:application/zip;base64,UEsDBA==")}`,
      ),
    ).rejects.toMatchObject(localizedImportFailure);
  });

  test("preserves navigation cancellation for starter import", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(callLoader("", controller.signal)).rejects.toBe(
      controller.signal.reason,
    );
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("redirects to the root board of the most recently updated set when no param is given", async () => {
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => (now += 1000));

    await seedBoardSets([
      { id: "set-1", rootBoardId: "root-1" },
      { id: "set-2", rootBoardId: "root-2" },
    ]);

    const response = await callLoader();

    assert(response instanceof Response);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sets/set-2/boards/root-2");
  });

  test("rejects without importing the starter board set when stored board sets cannot be read", async () => {
    onTestFinished(await makeBoardsDBUnreadable());
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(callLoader()).rejects.toThrow();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("imports the default board when no param is given and IDB is empty", async () => {
    const probe = await fetch(DEFAULT_BOARD_PATH);
    if (!probe.ok) {
      throw new Error(`Default board fixture missing at ${DEFAULT_BOARD_PATH}`);
    }

    const response = await callLoader();

    assert(response instanceof Response);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toMatch(
      /^\/sets\/[^/]+\/boards\/[^/]+$/,
    );

    const sets = await listBoardSetRecords();
    expect(sets).toHaveLength(1);
  });
});

describe("rootIndexAction", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("imports the confirmed URL from ?board and redirects to its board route", async () => {
    const response = await callAction(
      `?board=${encodeURIComponent(FIXTURE_BOARD_URL)}`,
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toMatch(
      /^\/sets\/[^/]+\/boards\/[^/]+$/,
    );
    expect(await listBoardSetRecords()).toHaveLength(1);
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
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("redirects home without importing when ?board is missing", async () => {
    const response = await callAction();

    expect(response.headers.get("Location")).toBe("/");
    expect(await listBoardSetRecords()).toEqual([]);
  });
});
