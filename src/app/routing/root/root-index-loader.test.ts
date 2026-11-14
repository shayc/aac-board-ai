import { listBoardSetRecords } from "@features/library";
import {
  makeBoardsDBUnreadable,
  resetBoardsDB,
  seedBoardSets,
} from "@features/library/testing";
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
import { routeArgs } from "../testing/route-args";
import { rootIndexLoader } from "./root-index-loader";

const DEFAULT_BOARD_PATH = "/first-words.obz";
const localizedImportFailure = {
  data: { code: routeErrorCodes.boardURLImportFailed },
  init: { status: 400 },
};

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
