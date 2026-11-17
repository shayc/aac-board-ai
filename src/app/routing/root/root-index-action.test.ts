import { listBoardSetRecords } from "@features/library";
import { resetBoardsDB, SAMPLE_OBZ_URL } from "@features/library/testing";
import { collectReportedErrors } from "@shared/testing/collect-reported-errors";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { localizedImportFailure } from "../testing/localized-import-failure";
import { routeArgs } from "../testing/route-args";
import { rootIndexAction } from "./root-index-action";

function callAction(
  searchParams = "",
  signal?: AbortSignal,
): Promise<Response> {
  return rootIndexAction(
    routeArgs(`http://localhost/${searchParams}`, { signal }),
  );
}

describe("rootIndexAction", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

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
    ).rejects.toMatchObject(localizedImportFailure);

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
    ).rejects.toMatchObject(localizedImportFailure);

    expect(reportedErrors).toEqual([
      new Error("Failed to fetch board: HTTP 404"),
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
