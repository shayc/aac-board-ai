import type { OBFBoard } from "open-board-format";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { LoaderFunctionArgs } from "react-router";
import { boardLoader, type BoardLoaderData } from "./board-loader";
import { invalidateBoardSets } from "./board-sets-store";
import {
  putAssets,
  putBoards,
  upsertBoardSet,
  withBoardsDB,
} from "./boards-db";
import { resetBoardsDB } from "./test-helpers";

const SET_ID = "loader-test-set";
const BOARD_ID = "loader-test-board";
const IMAGE_PATH = "images/test.png";
const REAL_PNG_URL = "/pwa-192x192.png";

// Seed a minimal board with one path-based image, using a real PNG blob so
// the loader's hydration produces an Image-loadable blob URL. Going direct to
// the storage layer (vs. importBoardFiles) keeps the test independent of OBZ
// fixture shape — the only thing under test here is boardLoader's behavior.
async function seedTestBoard(): Promise<void> {
  const pngResponse = await fetch(REAL_PNG_URL);
  if (!pngResponse.ok) {
    throw new Error(`Could not fetch ${REAL_PNG_URL} for fixture image`);
  }
  const pngBlob = await pngResponse.blob();

  const obfBoard: OBFBoard = {
    format: "open-board-0.1",
    id: BOARD_ID,
    name: "Test Board",
    grid: { rows: 1, columns: 1, order: [["btn-1"]] },
    buttons: [{ id: "btn-1", label: "test", image_id: "img-1" }],
    images: [{ id: "img-1", path: IMAGE_PATH, content_type: "image/png" }],
  };

  await withBoardsDB(async (db) => {
    await upsertBoardSet(db, {
      setId: SET_ID,
      name: "Loader Test",
      rootBoardId: BOARD_ID,
    });
    await putBoards(db, SET_ID, [
      { boardId: BOARD_ID, name: "Test Board", obf: obfBoard },
    ]);
    await putAssets(db, SET_ID, [
      { path: IMAGE_PATH, blob: pngBlob, mime: "image/png" },
    ]);
  });

  await invalidateBoardSets();
}

function callLoader(setId: string, boardId: string): Promise<BoardLoaderData> {
  const args = {
    request: new Request("http://localhost/"),
    params: { setId, boardId },
  } as unknown as LoaderFunctionArgs;
  return boardLoader(args);
}

async function expectThrown(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error("Expected loader to throw, but it resolved");
}

// `throw data(...)` produces a DataWithResponseInit instance — the router
// wraps it into an ErrorResponse only at the boundary. Check the shape
// directly when calling loaders straight.
function expectThrownStatus(error: unknown, status: number): void {
  expect(error).toBeTruthy();
  expect(error).toHaveProperty("init");
  const init = (error as { init: ResponseInit | null }).init;
  expect(init?.status).toBe(status);
}

// A blob URL is "alive" while its registry hasn't revoked it. Loading it as
// an Image is the most reliable cross-browser probe — the fixture asset is a
// PNG, so a live URL fires `load` and a revoked one fires `error`.
function isObjectUrlAlive(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const settle = (result: boolean) => {
      img.onload = null;
      img.onerror = null;
      resolve(result);
    };
    img.onload = () => settle(true);
    img.onerror = () => settle(false);
    img.src = url;
  });
}

describe("boardLoader", () => {
  beforeEach(async () => {
    await resetBoardsDB();
    await invalidateBoardSets();
  });

  afterEach(async () => {
    await resetBoardsDB();
  });

  test("returns a hydrated board on the happy path", async () => {
    await seedTestBoard();

    const result = await callLoader(SET_ID, BOARD_ID);

    expect(result.setId).toBe(SET_ID);
    expect(result.board.id).toBe(BOARD_ID);

    const imageSrc = result.board.buttons[0].imageSrc;
    expect(imageSrc).toBeDefined();
    expect(imageSrc!.startsWith("blob:")).toBe(true);
    expect(await isObjectUrlAlive(imageSrc!)).toBe(true);
  });

  test("throws 404 when the board is not in IDB", async () => {
    await seedTestBoard();

    const error = await expectThrown(callLoader(SET_ID, "missing-board"));

    expectThrownStatus(error, 404);
  });

  test("revokes the previous registry on the next loader run", async () => {
    await seedTestBoard();

    const first = await callLoader(SET_ID, BOARD_ID);
    const firstUrl = first.board.buttons[0].imageSrc;
    expect(firstUrl).toBeDefined();
    expect(await isObjectUrlAlive(firstUrl!)).toBe(true);

    const second = await callLoader(SET_ID, BOARD_ID);
    const secondUrl = second.board.buttons[0].imageSrc;
    expect(secondUrl).toBeDefined();

    expect(await isObjectUrlAlive(firstUrl!)).toBe(false);
    expect(await isObjectUrlAlive(secondUrl!)).toBe(true);
  });

  test("a 404 does not poison the module state for a later happy path", async () => {
    await seedTestBoard();

    await expectThrown(callLoader(SET_ID, "missing-board"));

    const result = await callLoader(SET_ID, BOARD_ID);
    const url = result.board.buttons[0].imageSrc;

    expect(url).toBeDefined();
    expect(await isObjectUrlAlive(url!)).toBe(true);
  });
});
