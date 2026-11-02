import type { OBFBoard, OBFMedia } from "@shayc/open-board-format";
import { obfToBoard } from "../obf/obf-to-board";
import type { Board } from "../board-types";
import { getAssetUrl } from "./asset-urls";
import { BoardNotFoundError, getBoardRecord } from "./board-content-storage";

export async function loadStoredBoard(
  boardSetId: string,
  boardId: string,
  signal?: AbortSignal,
): Promise<Board> {
  const obfBoard = await readOBFBoard(boardSetId, boardId);

  signal?.throwIfAborted();

  const obfWithUrls = await attachAssetUrls(boardSetId, obfBoard);

  signal?.throwIfAborted();

  return obfToBoard(obfWithUrls);
}

async function readOBFBoard(
  boardSetId: string,
  boardId: string,
): Promise<OBFBoard> {
  const record = await getBoardRecord(boardSetId, boardId);
  if (!record) {
    throw new BoardNotFoundError(boardSetId, boardId);
  }

  return record.obf;
}

async function attachAssetUrls(
  boardSetId: string,
  obfBoard: OBFBoard,
): Promise<OBFBoard> {
  const [images, sounds] = await Promise.all([
    attachUrlsToMedia(boardSetId, obfBoard.images),
    attachUrlsToMedia(boardSetId, obfBoard.sounds),
  ]);

  return { ...obfBoard, images, sounds };
}

async function attachUrlsToMedia(
  boardSetId: string,
  media: OBFMedia[] | undefined,
): Promise<OBFMedia[] | undefined> {
  if (!media?.length) {
    return media;
  }

  return Promise.all(
    media.map(async (item) => {
      if (!item.path) {
        return item;
      }

      try {
        const url = await getAssetUrl(boardSetId, item.path);

        return url ? { ...item, data: url } : item;
      } catch {
        return item;
      }
    }),
  );
}
