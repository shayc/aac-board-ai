import { listBoardSetRecords } from "@features/board";
import { resetBoardsDB } from "@features/board/testing";
import { loaderArgs } from "@shared/testing/loader-args";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { routeErrorCodes } from "../route-error";
import { rootIndexAction } from "./root-index-action";

const FIXTURE_BOARD_URL =
  "/src/features/board/testing/sample-boards/lots-of-stuff.obz";
const localizedImportFailure = {
  data: { code: routeErrorCodes.boardURLImportFailed },
  init: { status: 400 },
};

function callAction(
  searchParams = "",
  signal?: AbortSignal,
): Promise<Response> {
  return rootIndexAction(
    loaderArgs(`http://localhost/${searchParams}`, { signal }),
  );
}

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
