import type { OBFBoard, OBFMedia } from "@shayc/open-board-format";
import { obfToBoard } from "../obf/obf-to-board";
import type { Board } from "../board-types";
import { getAssetUrl } from "./asset-urls";
import { BoardNotFoundError, getBoard } from "./board-content-storage";

export async function loadStoredBoard(
  setId: string,
  boardId: string,
  signal?: AbortSignal,
): Promise<Board> {
  const obf = await readOBFBoard(setId, boardId);

  signal?.throwIfAborted();

  const obfWithUrls = await attachAssetUrls(setId, obf);

  signal?.throwIfAborted();

  return obfToBoard(obfWithUrls);
}

async function readOBFBoard(setId: string, boardId: string): Promise<OBFBoard> {
  const record = await getBoard(setId, boardId);
  if (!record) {
    throw new BoardNotFoundError(setId, boardId);
  }

  return record.obf;
}

async function attachAssetUrls(
  setId: string,
  obfBoard: OBFBoard,
): Promise<OBFBoard> {
  const [images, sounds] = await Promise.all([
    attachUrlsToMedia(setId, obfBoard.images),
    attachUrlsToMedia(setId, obfBoard.sounds),
  ]);

  return { ...obfBoard, images, sounds };
}

async function attachUrlsToMedia(
  setId: string,
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
        const url = await getAssetUrl(setId, item.path);

        return url ? { ...item, data: url } : item;
      } catch {
        return item;
      }
    }),
  );
}
