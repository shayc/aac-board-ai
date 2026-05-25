import {
  resetBoardsDB,
  seedBoardSets,
} from "@features/board/storage/test-helpers";
import type { LoaderFunctionArgs } from "react-router";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { boardSetIndexLoader } from "./board-set-index-loader";

function callLoader(setId: string): Promise<Response> {
  const args = {
    request: new Request("http://localhost/"),
    params: { setId },
  } as unknown as LoaderFunctionArgs;
  return boardSetIndexLoader(args);
}

async function expectThrown(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected loader to throw, but it resolved");
}

// `throw data(...)` produces a DataWithResponseInit instance — checking its
// shape directly. `isRouteErrorResponse` only matches the router's internal
// ErrorResponse wrapper, which is applied at the boundary, not at the throw
// site reached by direct loader calls.
function expectThrownStatus(error: unknown, status: number): void {
  expect(error).toBeTruthy();
  expect(error).toHaveProperty("init");
  const init = (error as { init: ResponseInit | null }).init;
  expect(init?.status).toBe(status);
}

describe("boardSetIndexLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
  });

  afterEach(async () => {
    await resetBoardsDB();
  });

  test("redirects to the root board route on the happy path", async () => {
    await seedBoardSets([{ setId: "set-1", rootBoardId: "root-1" }]);

    const response = await callLoader("set-1");

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/sets/set-1/boards/root-1");
  });

  test("throws 404 when the board set is missing", async () => {
    await seedBoardSets([]);

    const error = await expectThrown(callLoader("missing-set"));

    expectThrownStatus(error, 404);
  });
});
