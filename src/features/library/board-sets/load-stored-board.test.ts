import { assertDefined } from "@shared/testing/assert-defined";
import type { OBFBoard } from "@shayc/open-board-format";
import { beforeEach, describe, expect, test } from "vitest";
import type { Board } from "../board-types";
import { insertBoardSet } from "../storage/board-set-storage";
import { loadTestImageBlob, resetBoardsDB } from "../testing";
import { BoardNotFoundError, loadStoredBoard } from "./load-stored-board";

const SET_ID = "loader-test-set";
const BOARD_ID = "loader-test-board";
const OTHER_BOARD_ID = "other-test-board";
const IMAGE_PATH = "images/test.png";
const BOARD_KEY = { boardSetId: SET_ID, boardId: BOARD_ID };

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

  await insertBoardSet({
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

function isObjectURLAlive(url: string): Promise<boolean> {
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

function getImageURL(board: Board): string {
  const imageURL = board.buttons[0]?.imageSrc;
  assertDefined(imageURL);

  return imageURL;
}

describe("loadStoredBoard", () => {
  beforeEach(resetBoardsDB);

  test("returns the board with its asset URLs", async () => {
    await seedTestBoard();

    const board = await loadStoredBoard(BOARD_KEY);

    expect(board.id).toBe(BOARD_ID);

    const imageSrc = getImageURL(board);
    expect(imageSrc.startsWith("blob:")).toBe(true);
    expect(await isObjectURLAlive(imageSrc)).toBe(true);
  });

  test("falls back to the media url when its stored asset is missing", async () => {
    await insertBoardSet({
      id: SET_ID,
      rootBoardId: BOARD_ID,
      boards: [
        {
          format: "open-board-0.1",
          id: BOARD_ID,
          grid: { rows: 1, columns: 1, order: [["btn-1"]] },
          buttons: [{ id: "btn-1", label: "test", image_id: "img-1" }],
          images: [
            {
              id: "img-1",
              path: "images/missing.png",
              url: "https://example.com/test.png",
            },
          ],
        },
      ],
      assets: [],
    });

    const board = await loadStoredBoard(BOARD_KEY);

    expect(getImageURL(board)).toBe("https://example.com/test.png");
  });

  test("falls back to the media url when its path names no file", async () => {
    await insertBoardSet({
      id: SET_ID,
      rootBoardId: BOARD_ID,
      boards: [
        {
          format: "open-board-0.1",
          id: BOARD_ID,
          grid: { rows: 1, columns: 1, order: [["btn-1"]] },
          buttons: [{ id: "btn-1", label: "test", image_id: "img-1" }],
          images: [
            { id: "img-1", path: "/", url: "https://example.com/test.png" },
          ],
        },
      ],
      assets: [],
    });

    const board = await loadStoredBoard(BOARD_KEY);

    expect(getImageURL(board)).toBe("https://example.com/test.png");
  });

  test("keeps asset URLs usable after another board loads", async () => {
    await seedTestBoard();

    const url = getImageURL(await loadStoredBoard(BOARD_KEY));
    await loadStoredBoard({ boardSetId: SET_ID, boardId: OTHER_BOARD_ID });

    expect(await isObjectURLAlive(url)).toBe(true);
  });

  test("reuses asset URLs when a board loads again", async () => {
    await seedTestBoard();

    const first = await loadStoredBoard(BOARD_KEY);
    const second = await loadStoredBoard(BOARD_KEY);

    expect(getImageURL(second)).toBe(getImageURL(first));
  });

  test("rejects a missing board and remains usable for a later load", async () => {
    await seedTestBoard();

    await expect(
      loadStoredBoard({ boardSetId: SET_ID, boardId: "missing-board" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);

    const board = await loadStoredBoard(BOARD_KEY);

    expect(await isObjectURLAlive(getImageURL(board))).toBe(true);
  });

  test("keeps links to stored boards and drops links to boards the set lacks", async () => {
    await insertBoardSet({
      id: SET_ID,
      rootBoardId: BOARD_ID,
      boards: [
        {
          format: "open-board-0.1",
          id: BOARD_ID,
          grid: { rows: 1, columns: 3, order: [["stored", "absent", "plain"]] },
          buttons: [
            {
              id: "stored",
              label: "animals",
              load_board: { id: OTHER_BOARD_ID },
            },
            { id: "absent", label: "food", load_board: { id: "not-in-set" } },
            { id: "plain", label: "hello" },
          ],
        },
        {
          format: "open-board-0.1",
          id: OTHER_BOARD_ID,
          grid: { rows: 1, columns: 1, order: [[null]] },
          buttons: [],
        },
      ],
      assets: [],
    });

    const board = await loadStoredBoard(BOARD_KEY);

    expect(
      board.buttons.map(({ label, linkedBoardId }) => [label, linkedBoardId]),
    ).toEqual([
      ["animals", OTHER_BOARD_ID],
      ["food", undefined],
      ["hello", undefined],
    ]);
  });

  test("drops a link to a board that only another set stores", async () => {
    await insertBoardSet({
      id: SET_ID,
      rootBoardId: BOARD_ID,
      boards: [
        {
          format: "open-board-0.1",
          id: BOARD_ID,
          grid: { rows: 1, columns: 1, order: [["elsewhere"]] },
          buttons: [
            { id: "elsewhere", label: "food", load_board: { id: "food" } },
          ],
        },
      ],
      assets: [],
    });
    await insertBoardSet({
      id: "another-set",
      rootBoardId: "food",
      boards: [
        {
          format: "open-board-0.1",
          id: "food",
          grid: { rows: 1, columns: 1, order: [[null]] },
          buttons: [],
        },
      ],
      assets: [],
    });

    const board = await loadStoredBoard(BOARD_KEY);

    expect(board.buttons[0]?.linkedBoardId).toBeUndefined();
  });

  test("an aborted load does not disturb a loaded board", async () => {
    await seedTestBoard();

    const url = getImageURL(await loadStoredBoard(BOARD_KEY));

    const aborted = new AbortController();
    aborted.abort();
    await expect(
      loadStoredBoard(BOARD_KEY, aborted.signal),
    ).rejects.toMatchObject({ name: "AbortError" });

    expect(await isObjectURLAlive(url)).toBe(true);
  });
});
