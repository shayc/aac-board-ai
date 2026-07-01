import type { OBFBoard } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test } from "vitest";
import { assertDefined } from "@shared/testing/assert-defined";
import { invalidateBoardSets } from "../board-sets/board-sets-store";
import { hydrateBoard } from "./board-hydration";
import { BoardNotFoundError, replaceBoardSet } from "./boards-db";
import { resetBoardsDB } from "./test-utils";

const SET_ID = "loader-test-set";
const BOARD_ID = "loader-test-board";
const IMAGE_PATH = "images/test.png";
const REAL_PNG_URL = "/pwa-192x192.png";

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

  await replaceBoardSet({
    boardSet: { setId: SET_ID, name: "Loader Test", rootBoardId: BOARD_ID },
    boards: [{ boardId: BOARD_ID, name: "Test Board", obf: obfBoard }],
    assets: [{ path: IMAGE_PATH, blob: pngBlob }],
  });

  await invalidateBoardSets();
}

async function expectThrown(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }

  throw new Error("Expected hydrateBoard to throw, but it resolved");
}

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

describe("hydrateBoard", () => {
  beforeEach(async () => {
    await resetBoardsDB();
    await invalidateBoardSets();
  });

  test("returns a hydrated board on the happy path", async () => {
    await seedTestBoard();

    const board = await hydrateBoard(SET_ID, BOARD_ID);

    expect(board.id).toBe(BOARD_ID);

    const imageSrc = board.buttons[0].imageSrc;
    assertDefined(imageSrc);
    expect(imageSrc.startsWith("blob:")).toBe(true);
    expect(await isObjectUrlAlive(imageSrc)).toBe(true);
  });

  test("throws BoardNotFoundError when the board is not in IDB", async () => {
    await seedTestBoard();

    const error = await expectThrown(hydrateBoard(SET_ID, "missing-board"));

    expect(error).toBeInstanceOf(BoardNotFoundError);
  });

  test("revokes the previous registry on the next hydrateBoard call", async () => {
    await seedTestBoard();

    const first = await hydrateBoard(SET_ID, BOARD_ID);
    const firstUrl = first.buttons[0].imageSrc;
    assertDefined(firstUrl);
    expect(await isObjectUrlAlive(firstUrl)).toBe(true);

    const second = await hydrateBoard(SET_ID, BOARD_ID);
    const secondUrl = second.buttons[0].imageSrc;
    assertDefined(secondUrl);

    expect(await isObjectUrlAlive(firstUrl)).toBe(false);
    expect(await isObjectUrlAlive(secondUrl)).toBe(true);
  });

  test("a missing-board error does not poison module state for a later success", async () => {
    await seedTestBoard();

    await expectThrown(hydrateBoard(SET_ID, "missing-board"));

    const board = await hydrateBoard(SET_ID, BOARD_ID);
    const url = board.buttons[0].imageSrc;

    assertDefined(url);
    expect(await isObjectUrlAlive(url)).toBe(true);
  });

  test("self-destructs without promoting when the signal is already aborted", async () => {
    await seedTestBoard();

    const live = await hydrateBoard(SET_ID, BOARD_ID);
    const liveUrl = live.buttons[0].imageSrc;
    assertDefined(liveUrl);
    expect(await isObjectUrlAlive(liveUrl)).toBe(true);

    const aborted = new AbortController();
    aborted.abort();
    const error = await expectThrown(
      hydrateBoard(SET_ID, BOARD_ID, aborted.signal),
    );

    expect((error as Error).name).toBe("AbortError");
    // A superseded load self-destructs instead of promoting, so the live load's
    // URLs aren't orphaned.
    expect(await isObjectUrlAlive(liveUrl)).toBe(true);
  });

  test("a later load still hydrates after an aborted one", async () => {
    await seedTestBoard();

    const aborted = new AbortController();
    aborted.abort();
    await expectThrown(hydrateBoard(SET_ID, BOARD_ID, aborted.signal));

    const board = await hydrateBoard(SET_ID, BOARD_ID);
    const url = board.buttons[0].imageSrc;

    assertDefined(url);
    expect(await isObjectUrlAlive(url)).toBe(true);
  });
});
