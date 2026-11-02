import { assertDefined } from "@shared/testing/assert-defined";
import type { OBFBoard } from "@shayc/open-board-format";
import type { Board } from "../board-types";
import { beforeEach, describe, expect, test } from "vitest";
import { loadTestImageBlob, resetBoardsDB } from "../testing";
import { BoardNotFoundError } from "./board-content-storage";
import { createBoardSet } from "./board-set-storage";
import { loadStoredBoard } from "./load-stored-board";

const SET_ID = "loader-test-set";
const BOARD_ID = "loader-test-board";
const OTHER_BOARD_ID = "other-test-board";
const IMAGE_PATH = "images/test.png";

async function seedTestBoard(): Promise<void> {
  const pngBlob = await loadTestImageBlob();

  const obfBoard: OBFBoard = {
    format: "open-board-0.1",
    id: BOARD_ID,
    name: "Test Board",
    grid: { rows: 1, columns: 1, order: [["btn-1"]] },
    buttons: [{ id: "btn-1", label: "test", image_id: "img-1" }],
    images: [{ id: "img-1", path: IMAGE_PATH, content_type: "image/png" }],
  };

  await createBoardSet({
    id: SET_ID,
    name: "Loader Test",
    rootBoardId: BOARD_ID,
    boards: [
      obfBoard,
      { ...obfBoard, id: OTHER_BOARD_ID, name: "Other Board", images: [] },
    ],
    assets: [{ path: IMAGE_PATH, blob: pngBlob }],
  });
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

function getImageUrl(board: Board): string {
  const imageUrl = board.buttons[0].imageSrc;
  assertDefined(imageUrl);

  return imageUrl;
}

describe("loadStoredBoard", () => {
  beforeEach(resetBoardsDB);

  test("returns a board with asset URLs on the happy path", async () => {
    await seedTestBoard();

    const board = await loadStoredBoard(SET_ID, BOARD_ID);

    expect(board.id).toBe(BOARD_ID);

    const imageSrc = getImageUrl(board);
    expect(imageSrc.startsWith("blob:")).toBe(true);
    expect(await isObjectUrlAlive(imageSrc)).toBe(true);
  });

  test("keeps asset URLs usable after another board loads", async () => {
    await seedTestBoard();

    const url = getImageUrl(await loadStoredBoard(SET_ID, BOARD_ID));
    await loadStoredBoard(SET_ID, OTHER_BOARD_ID);

    expect(await isObjectUrlAlive(url)).toBe(true);
  });

  test("reuses asset URLs when a board loads again", async () => {
    await seedTestBoard();

    const first = await loadStoredBoard(SET_ID, BOARD_ID);
    const second = await loadStoredBoard(SET_ID, BOARD_ID);

    expect(getImageUrl(second)).toBe(getImageUrl(first));
  });

  test("rejects a missing board and remains usable for a later load", async () => {
    await seedTestBoard();

    await expect(
      loadStoredBoard(SET_ID, "missing-board"),
    ).rejects.toBeInstanceOf(BoardNotFoundError);

    const board = await loadStoredBoard(SET_ID, BOARD_ID);

    expect(await isObjectUrlAlive(getImageUrl(board))).toBe(true);
  });

  test("an aborted load does not disturb a loaded board", async () => {
    await seedTestBoard();

    const url = getImageUrl(await loadStoredBoard(SET_ID, BOARD_ID));

    const aborted = new AbortController();
    aborted.abort();
    await expect(
      loadStoredBoard(SET_ID, BOARD_ID, aborted.signal),
    ).rejects.toMatchObject({ name: "AbortError" });

    expect(await isObjectUrlAlive(url)).toBe(true);
  });
});
