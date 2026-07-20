import type { OBFBoard } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test } from "vitest";
import { assertDefined } from "@shared/testing/assert-defined";
import { refreshBoardSets } from "../board-sets/board-sets-store";
import { hydrateBoard, type HydratedBoard } from "./board-hydration";
import { BoardNotFoundError, replaceBoardSet } from "./boards-db";
import { resetBoardsDB } from "../testing";

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

  await refreshBoardSets();
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

function getImageUrl(loadedBoard: HydratedBoard): string {
  const imageUrl = loadedBoard.board.buttons[0].imageSrc;
  assertDefined(imageUrl);

  return imageUrl;
}

describe("hydrateBoard", () => {
  beforeEach(async () => {
    await resetBoardsDB();
    await refreshBoardSets();
  });

  test("returns a hydrated board on the happy path", async () => {
    await seedTestBoard();

    const loadedBoard = await hydrateBoard(SET_ID, BOARD_ID);

    expect(loadedBoard.board.id).toBe(BOARD_ID);

    const imageSrc = getImageUrl(loadedBoard);
    expect(imageSrc.startsWith("blob:")).toBe(true);
    expect(await isObjectUrlAlive(imageSrc)).toBe(true);

    loadedBoard.media.dispose();
  });

  test("throws BoardNotFoundError when the board is not in IDB", async () => {
    await seedTestBoard();

    const error = await expectThrown(hydrateBoard(SET_ID, "missing-board"));

    expect(error).toBeInstanceOf(BoardNotFoundError);
  });

  test("keeps concurrent hydration resources independent", async () => {
    await seedTestBoard();

    const first = await hydrateBoard(SET_ID, BOARD_ID);
    const second = await hydrateBoard(SET_ID, BOARD_ID);
    const firstUrl = getImageUrl(first);
    const secondUrl = getImageUrl(second);

    expect(await isObjectUrlAlive(firstUrl)).toBe(true);
    expect(await isObjectUrlAlive(secondUrl)).toBe(true);

    first.media.dispose();

    expect(await isObjectUrlAlive(firstUrl)).toBe(false);
    expect(await isObjectUrlAlive(secondUrl)).toBe(true);

    second.media.dispose();
  });

  test("a missing-board error does not affect a later success", async () => {
    await seedTestBoard();

    await expectThrown(hydrateBoard(SET_ID, "missing-board"));

    const loadedBoard = await hydrateBoard(SET_ID, BOARD_ID);
    const url = getImageUrl(loadedBoard);

    expect(await isObjectUrlAlive(url)).toBe(true);

    loadedBoard.media.dispose();
  });

  test("an already-aborted load does not disturb another resource", async () => {
    await seedTestBoard();

    const live = await hydrateBoard(SET_ID, BOARD_ID);
    const liveUrl = getImageUrl(live);
    expect(await isObjectUrlAlive(liveUrl)).toBe(true);

    const aborted = new AbortController();
    aborted.abort();
    const error = await expectThrown(
      hydrateBoard(SET_ID, BOARD_ID, aborted.signal),
    );

    expect((error as Error).name).toBe("AbortError");
    expect(await isObjectUrlAlive(liveUrl)).toBe(true);

    live.media.dispose();
  });

  test("disposes provisional media when its signal aborts", async () => {
    await seedTestBoard();

    const controller = new AbortController();
    const loadedBoard = await hydrateBoard(SET_ID, BOARD_ID, controller.signal);
    const url = getImageUrl(loadedBoard);
    expect(await isObjectUrlAlive(url)).toBe(true);

    controller.abort();

    expect(await isObjectUrlAlive(url)).toBe(false);
    loadedBoard.media.dispose();
    expect(() => loadedBoard.media.commit()).toThrow(
      "Cannot commit disposed board media",
    );
  });

  test("a committed resource survives its loader signal", async () => {
    await seedTestBoard();

    const controller = new AbortController();
    const loadedBoard = await hydrateBoard(SET_ID, BOARD_ID, controller.signal);
    const url = getImageUrl(loadedBoard);

    loadedBoard.media.commit();
    controller.abort();

    expect(await isObjectUrlAlive(url)).toBe(true);

    loadedBoard.media.dispose();

    expect(await isObjectUrlAlive(url)).toBe(false);
  });

  test("a later load still hydrates after an aborted one", async () => {
    await seedTestBoard();

    const aborted = new AbortController();
    aborted.abort();
    await expectThrown(hydrateBoard(SET_ID, BOARD_ID, aborted.signal));

    const loadedBoard = await hydrateBoard(SET_ID, BOARD_ID);
    const url = getImageUrl(loadedBoard);

    expect(await isObjectUrlAlive(url)).toBe(true);

    loadedBoard.media.dispose();
  });
});
