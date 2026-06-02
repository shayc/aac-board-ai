import {
  createObjectUrlRegistry,
  type ObjectUrlRegistry,
} from "@shared/utils/object-url";
import type { OBFBoard, OBFMedia } from "@shayc/open-board-format";
import { obfToBoard } from "../obf/obf-to-board";
import type { Board } from "../types";
import {
  getBoardSet as dbGetBoardSet,
  getAssetBlob,
  getBoard,
  updateBoardStrings,
  type BoardSetRecord,
} from "./db";

export class BoardNotFoundError extends Error {
  constructor(setId: string, boardId: string) {
    super(`Board not found: ${setId}/${boardId}`);
    this.name = "BoardNotFoundError";
  }
}

// Single concurrent caller assumed — the only consumer is boardLoader.
// Revoke on the next call rather than from the caller: the consumer can't
// know when its URLs are safe to release; the next load defines that boundary.
let previousRegistry: ObjectUrlRegistry | null = null;

export async function getBoardSet(
  setId: string,
): Promise<BoardSetRecord | undefined> {
  return dbGetBoardSet(setId);
}

export async function persistBoardTranslations(
  setId: string,
  boardId: string,
  locale: string,
  translations: Record<string, string>,
): Promise<void> {
  await updateBoardStrings(setId, boardId, locale, translations);
}

export async function hydrateBoard(
  setId: string,
  boardId: string,
  signal?: AbortSignal,
): Promise<Board> {
  const registry = createObjectUrlRegistry();
  try {
    const obf = await fetchOBFBoard(setId, boardId);
    const hydrated = await hydrateOBFBoard(setId, obf, registry);
    const board = obfToBoard(hydrated);

    // Don't promote a superseded registry — it would orphan the live one.
    signal?.throwIfAborted();

    const previous = previousRegistry;
    previousRegistry = registry;
    previous?.revokeAll();

    return board;
  } catch (error) {
    registry.revokeAll();
    throw error;
  }
}

async function fetchOBFBoard(
  setId: string,
  boardId: string,
): Promise<OBFBoard> {
  const record = await getBoard(setId, boardId);
  if (!record) {
    throw new BoardNotFoundError(setId, boardId);
  }

  return record.obf;
}

async function hydrateOBFBoard(
  setId: string,
  board: OBFBoard,
  registry: ObjectUrlRegistry,
): Promise<OBFBoard> {
  const [images, sounds] = await Promise.all([
    hydrateAssets(setId, board.images, registry),
    hydrateAssets(setId, board.sounds, registry),
  ]);

  return { ...board, images, sounds };
}

async function hydrateAssets(
  setId: string,
  assets: OBFMedia[] | undefined,
  registry: ObjectUrlRegistry,
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
        const blob = await getAssetBlob(setId, asset.path);
        const url = blob ? registry.create(blob) : null;

        return url ? { ...asset, data: url } : asset;
      } catch {
        return asset;
      }
    }),
  );
}
