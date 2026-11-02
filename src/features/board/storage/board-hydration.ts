import type { OBFBoard, OBFMedia } from "@shayc/open-board-format";
import { obfToBoard } from "../obf/obf-to-board";
import type { Board } from "../board-types";
import { getAssetUrl } from "./asset-urls";
import { BoardNotFoundError, getBoard } from "./board-content-storage";

export async function hydrateBoard(
  setId: string,
  boardId: string,
  signal?: AbortSignal,
): Promise<Board> {
  const obf = await readOBFBoard(setId, boardId);

  signal?.throwIfAborted();

  const hydrated = await hydrateOBFBoard(setId, obf);

  signal?.throwIfAborted();

  return obfToBoard(hydrated);
}

async function readOBFBoard(setId: string, boardId: string): Promise<OBFBoard> {
  const record = await getBoard(setId, boardId);
  if (!record) {
    throw new BoardNotFoundError(setId, boardId);
  }

  return record.obf;
}

async function hydrateOBFBoard(
  setId: string,
  board: OBFBoard,
): Promise<OBFBoard> {
  const [images, sounds] = await Promise.all([
    hydrateAssets(setId, board.images),
    hydrateAssets(setId, board.sounds),
  ]);

  return { ...board, images, sounds };
}

async function hydrateAssets(
  setId: string,
  assets: OBFMedia[] | undefined,
): Promise<OBFMedia[] | undefined> {
  if (!assets?.length) {
    return assets;
  }

  return Promise.all(
    assets.map(async (asset) => {
      if (!asset.path) {
        return asset;
      }

      try {
        const url = await getAssetUrl(setId, asset.path);

        return url ? { ...asset, data: url } : asset;
      } catch {
        return asset;
      }
    }),
  );
}
