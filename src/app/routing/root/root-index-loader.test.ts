import { listBoardSetRecords } from "@features/library";
import {
  makeBoardsDBUnreadable,
  resetBoardsDB,
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
import { localizedImportFailure } from "../testing/localized-import-failure";
import { routeArgs } from "../testing/route-args";
import { rootIndexLoader } from "./root-index-loader";

const DEFAULT_BOARD_PATH = "/boards/first-words.obz";

function callLoader(searchParams = "", signal?: AbortSignal) {
  return rootIndexLoader(
    routeArgs(`http://localhost/${searchParams}`, { signal }),
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
    ).rejects.toMatchObject(localizedImportFailure);

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
    ).rejects.toMatchObject(localizedImportFailure);

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
