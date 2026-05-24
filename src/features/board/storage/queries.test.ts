import type { OBFBoard } from "open-board-format";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { invalidateBoardSets } from "./board-sets-store";
import { putAssets, putBoards, upsertBoardSet, withBoardsDB } from "./db";
import { BoardNotFoundError, loadBoard } from "./queries";
import { resetBoardsDB } from "./test-helpers";

const SET_ID = "loader-test-set";
const BOARD_ID = "loader-test-board";
const IMAGE_PATH = "images/test.png";
const REAL_PNG_URL = "/pwa-192x192.png";

// Seed a minimal board with one path-based image, using a real PNG blob so
// hydration produces an Image-loadable blob URL. Going direct to the storage
// layer (vs. importBoardFiles) keeps the test independent of OBZ fixture
// shape — the only thing under test here is loadBoard's behavior.
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

async function expectThrown(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected loadBoard to throw, but it resolved");
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

describe("loadBoard", () => {
  beforeEach(async () => {
    await resetBoardsDB();
    await invalidateBoardSets();
  });

  afterEach(async () => {
    await resetBoardsDB();
  });

  test("returns a hydrated board on the happy path", async () => {
    await seedTestBoard();

    const board = await loadBoard(SET_ID, BOARD_ID);

    expect(board.id).toBe(BOARD_ID);

    const imageSrc = board.buttons[0].imageSrc;
    expect(imageSrc).toBeDefined();
    expect(imageSrc!.startsWith("blob:")).toBe(true);
    expect(await isObjectUrlAlive(imageSrc!)).toBe(true);
  });

  test("throws BoardNotFoundError when the board is not in IDB", async () => {
    await seedTestBoard();

    const error = await expectThrown(loadBoard(SET_ID, "missing-board"));

    expect(error).toBeInstanceOf(BoardNotFoundError);
  });

  test("revokes the previous registry on the next loadBoard call", async () => {
    await seedTestBoard();

    const first = await loadBoard(SET_ID, BOARD_ID);
    const firstUrl = first.buttons[0].imageSrc;
    expect(firstUrl).toBeDefined();
    expect(await isObjectUrlAlive(firstUrl!)).toBe(true);

    const second = await loadBoard(SET_ID, BOARD_ID);
    const secondUrl = second.buttons[0].imageSrc;
    expect(secondUrl).toBeDefined();

    expect(await isObjectUrlAlive(firstUrl!)).toBe(false);
    expect(await isObjectUrlAlive(secondUrl!)).toBe(true);
  });

  test("a missing-board error does not poison module state for a later success", async () => {
    await seedTestBoard();

    await expectThrown(loadBoard(SET_ID, "missing-board"));

    const board = await loadBoard(SET_ID, BOARD_ID);
    const url = board.buttons[0].imageSrc;

    expect(url).toBeDefined();
    expect(await isObjectUrlAlive(url!)).toBe(true);
  });
});
