import { listBoardSetRecords } from "@features/library";
import {
  makeBoardsDBUnreadable,
  resetBoardsDB,
  SAMPLE_OBZ_URL,
  seedBoardSets,
} from "@features/library/testing";
import { collectReportedErrors } from "@shared/testing/collect-reported-errors";
import {
  assert,
  beforeEach,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from "vitest";
import { ROUTE_ERROR_CODES } from "../errors/route-error";
import { routeArgs } from "../testing/route-args";
import { rootIndexAction, rootIndexLoader } from "./root-index-route";

const DEFAULT_BOARD_PATH = "/boards/first-words.obz";

const LOCALIZED_IMPORT_FAILURE = {
  data: { code: ROUTE_ERROR_CODES.boardFileURLImportFailed },
  init: { status: 400 },
};

beforeEach(resetBoardsDB);

function callLoader(searchParams = "", signal?: AbortSignal) {
  return rootIndexLoader(
    routeArgs(`http://localhost/${searchParams}`, { signal }),
  );
}

function callAction(
  searchParams = "",
  signal?: AbortSignal,
): Promise<Response> {
  return rootIndexAction(
    routeArgs(`http://localhost/${searchParams}`, { signal }),
  );
}

describe("rootIndexLoader", () => {
  test("asks for confirmation instead of importing the URL from ?board", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      callLoader(
        `?board=${encodeURIComponent("https://boards.example/core.obz")}`,
      ),
    ).resolves.toEqual({ boardFileHost: "boards.example" });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("throws a localized 400 and reports the cause for a hostless board URL before asking", async () => {
    const reportedErrors = collectReportedErrors();

    await expect(
      callLoader(
        `?board=${encodeURIComponent("data:application/zip;base64,UEsDBA==")}`,
      ),
    ).rejects.toMatchObject(LOCALIZED_IMPORT_FAILURE);

    expect(reportedErrors).toMatchObject([
      { message: "Unsupported board file URL scheme: data:" },
    ]);
  });

  test("throws a localized 400 and reports the cause for an http: board URL on another host before asking", async () => {
    const reportedErrors = collectReportedErrors();

    await expect(
      callLoader(
        `?board=${encodeURIComponent("http://boards.example/core.obz")}`,
      ),
    ).rejects.toMatchObject(LOCALIZED_IMPORT_FAILURE);

    expect(reportedErrors).toMatchObject([
      { message: "Unsupported board file URL scheme: http:" },
    ]);
  });

  test("rejects with the navigation's own abort reason during the starter import", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(callLoader("", controller.signal)).rejects.toBe(
      controller.signal.reason,
    );
    expect(await listBoardSetRecords()).toEqual([]);
  });

  test("redirects to the most recently updated board set when no board URL is given", async () => {
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

  test("imports the starter board set when no board URL is given and nothing is stored", async () => {
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
  test("imports the confirmed URL from ?board and redirects to its board route", async () => {
    const response = await callAction(
      `?board=${encodeURIComponent(SAMPLE_OBZ_URL)}`,
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toMatch(
      /^\/sets\/[^/]+\/boards\/[^/]+$/,
    );
    expect(await listBoardSetRecords()).toHaveLength(1);
  });

  test("throws a localized 400 instead of fetching a non-http(s) board URL", async () => {
    const reportedErrors = collectReportedErrors();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      callAction(
        `?board=${encodeURIComponent("data:application/zip;base64,UEsDBA==")}`,
      ),
    ).rejects.toMatchObject(LOCALIZED_IMPORT_FAILURE);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(reportedErrors).toHaveLength(1);
  });

  test("throws a localized 400 and reports the cause when the board URL cannot be imported", async () => {
    const reportedErrors = collectReportedErrors();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    await expect(
      callAction(
        `?board=${encodeURIComponent("https://example.com/gone.obz")}`,
      ),
    ).rejects.toMatchObject(LOCALIZED_IMPORT_FAILURE);

    expect(reportedErrors).toEqual([
      new Error("Failed to fetch board file: HTTP 404"),
    ]);
  });

  test("rejects with the navigation's own abort reason without importing", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      callAction(
        `?board=${encodeURIComponent(SAMPLE_OBZ_URL)}`,
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
