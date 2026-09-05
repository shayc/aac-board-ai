import { beforeEach, describe, expect, test } from "vitest";
import { acquireMediaUrl } from "@shared/media/acquire-media-url";
import { assertDefined } from "@shared/testing/assert-defined";
import {
  loadTestImageBlob,
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "../testing";
import { BoardNotFoundError } from "./board-content-storage";
import { deleteBoardSet } from "./board-set-storage";
import { loadBoard } from "./load-board";

const SET_ID = "media-set";
const BOARD_ID = "media-board";

async function seedMediaBoard() {
  const blob = await loadTestImageBlob();
  const obf = makeOBFBoard({
    id: BOARD_ID,
    buttons: [{ id: "button", label: "Image", image_id: "image" }],
    images: [{ id: "image", path: "image.png" }],
  });
  await seedBoardSets([
    {
      setId: SET_ID,
      rootBoardId: BOARD_ID,
      boards: [{ boardId: BOARD_ID, name: "Media", obf }],
      assets: [{ path: "image.png", blob }],
    },
  ]);
}

describe("loadBoard", () => {
  beforeEach(resetBoardsDB);

  test("returns local blob contents instead of route-owned URLs", async () => {
    await seedMediaBoard();
    const board = await loadBoard({ setId: SET_ID, boardId: BOARD_ID });

    expect(board.id).toBe(BOARD_ID);
    const image = board.buttons[0].image;
    expect(image).toBeInstanceOf(Blob);
    assertDefined(image);
    const media = acquireMediaUrl(image);
    expect((await fetch(media.url)).ok).toBe(true);
    media.release();
  });

  test("concurrent snapshots retain their contents after the source set is deleted", async () => {
    await seedMediaBoard();
    const [first, second] = await Promise.all([
      loadBoard({ setId: SET_ID, boardId: BOARD_ID }),
      loadBoard({ setId: SET_ID, boardId: BOARD_ID }),
    ]);
    await deleteBoardSet(SET_ID);

    for (const board of [first, second]) {
      const image = board.buttons[0].image;
      assertDefined(image);
      const media = acquireMediaUrl(image);
      expect((await fetch(media.url)).ok).toBe(true);
      media.release();
    }
  });

  test("missing-board failures do not disturb later loads", async () => {
    await seedMediaBoard();
    await expect(
      loadBoard({ setId: SET_ID, boardId: "missing" }),
    ).rejects.toBeInstanceOf(BoardNotFoundError);
    const board = await loadBoard({ setId: SET_ID, boardId: BOARD_ID });
    expect(board.buttons[0].image).toBeInstanceOf(Blob);
  });

  test("an aborted load does not disturb a completed snapshot or a later load", async () => {
    await seedMediaBoard();
    const live = await loadBoard({ setId: SET_ID, boardId: BOARD_ID });
    await expect(
      loadBoard({
        setId: SET_ID,
        boardId: BOARD_ID,
        signal: AbortSignal.abort(),
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
    const later = await loadBoard({ setId: SET_ID, boardId: BOARD_ID });
    expect(live.buttons[0].image).toBeInstanceOf(Blob);
    expect(later.buttons[0].image).toBeInstanceOf(Blob);
  });

  test("aborting a finished loader cannot revoke its returned contents", async () => {
    await seedMediaBoard();
    const controller = new AbortController();
    const board = await loadBoard({
      setId: SET_ID,
      boardId: BOARD_ID,
      signal: controller.signal,
    });
    controller.abort();
    const image = board.buttons[0].image;
    assertDefined(image);
    const media = acquireMediaUrl(image);
    expect((await fetch(media.url)).ok).toBe(true);
    media.release();
  });
});
