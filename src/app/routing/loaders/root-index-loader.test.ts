import { listBoardSets, rememberBoardSet } from "@features/board";
import { resetBoardsDB, seedBoardSets } from "@features/board/testing";
import type { LoaderFunctionArgs } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { rootIndexLoader } from "./root-index-loader";

const FIXTURE_BOARD_URL =
  "/src/features/board/testing/sample-boards/lots-of-stuff.obz";
const DEFAULT_BOARD_PATH = "/quick-core-24.obz";
function callLoader(
  searchParams = "",
  signal?: AbortSignal,
): Promise<Response> {
  const args = {
    request: new Request(`http://localhost/${searchParams}`, { signal }),
    params: {},
  } as unknown as LoaderFunctionArgs;

  return rootIndexLoader(args);
}

describe("rootIndexLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  test("keeps a ?board link on the redirect without fetching or importing it", async () => {
    await seedBoardSets([{ id: "set-1", rootBoardId: "root-1" }]);
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const search = `?board=${encodeURIComponent(FIXTURE_BOARD_URL)}`;

    const response = await callLoader(search);

    expect(response.headers.get("Location")).toBe(
      `/sets/set-1/boards/root-1${search}`,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await listBoardSets()).toHaveLength(1);
  });

  test("preserves navigation cancellation for the starter import", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(callLoader("", controller.signal)).rejects.toBe(
      controller.signal.reason,
    );
    expect(await listBoardSets()).toEqual([]);
  });

  test("opens the last-used set instead of the newest one", async () => {
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => (now += 1000));

    await seedBoardSets([
      { id: "set-1", rootBoardId: "root-1" },
      { id: "set-2", rootBoardId: "root-2" },
    ]);
    rememberBoardSet("set-1");

    const response = await callLoader();

    expect(response.headers.get("Location")).toBe("/sets/set-1/boards/root-1");
  });

  test("falls back to the newest set when the last-used set is gone", async () => {
    await seedBoardSets([{ id: "set-1", rootBoardId: "root-1" }]);
    rememberBoardSet("deleted-set");

    const response = await callLoader();

    expect(response.headers.get("Location")).toBe("/sets/set-1/boards/root-1");
  });

  test("redirects to the root board of the most recently updated set when no param is given", async () => {
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => (now += 1000));

    await seedBoardSets([
      { id: "set-1", rootBoardId: "root-1" },
      { id: "set-2", rootBoardId: "root-2" },
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

    const sets = await listBoardSets();
    expect(sets).toHaveLength(1);
  });
});
