import {
  createObjectUrlRegistry,
  type ObjectUrlRegistry,
} from "@shared/utils/object-url";
import type { OBFBoard, OBFMedia } from "open-board-format";
import { obfToBoard } from "../obf/obf-to-board";
import type { Board } from "../types";
import {
  getBoardSet as dbGetBoardSet,
  getAssetBlob,
  getBoard,
  withBoardsDB,
  type BoardSetRecord,
  type BoardsDB,
} from "./db";

export class BoardNotFoundError extends Error {
  constructor(setId: string, boardId: string) {
    super(`Board not found: ${setId}/${boardId}`);
    this.name = "BoardNotFoundError";
  }
}

export async function getBoardSet(
  setId: string,
): Promise<BoardSetRecord | undefined> {
  return withBoardsDB((db) => dbGetBoardSet(db, setId));
}

// Single concurrent caller assumed — the only consumer is boardLoader.
// Revoke on the next call rather than from the caller: the consumer can't
// know when its URLs are safe to release; the next load defines that boundary.
let previousRegistry: ObjectUrlRegistry | null = null;

export async function hydrateBoard(
  setId: string,
  boardId: string,
  signal?: AbortSignal,
): Promise<Board> {
  const registry = createObjectUrlRegistry();
  try {
    const board = await withBoardsDB(async (db) => {
      const obf = await fetchOBFBoard(db, setId, boardId);
      const hydrated = await hydrateOBFBoard(db, setId, obf, registry);
      return obfToBoard(hydrated);
    });

    // Don't promote a superseded registry — it would orphan the live one.
    if (signal?.aborted) {
      registry.revokeAll();
      throw new DOMException("Aborted", "AbortError");
    }

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
  db: BoardsDB,
  setId: string,
  boardId: string,
): Promise<OBFBoard> {
  const record = await getBoard(db, setId, boardId);
  if (!record) {
    throw new BoardNotFoundError(setId, boardId);
  }
  return record.obf;
}

async function hydrateOBFBoard(
  db: BoardsDB,
  setId: string,
  board: OBFBoard,
  registry: ObjectUrlRegistry,
): Promise<OBFBoard> {
  const [images, sounds] = await Promise.all([
    hydrateAssets(db, setId, board.images, registry),
    hydrateAssets(db, setId, board.sounds, registry),
  ]);
  return { ...board, images, sounds };
}

async function hydrateAssets(
  db: BoardsDB,
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
        const blob = await getAssetBlob(db, setId, asset.path);
        const url = blob ? registry.create(blob) : null;
        return url ? { ...asset, data: url } : asset;
      } catch {
        return asset;
      }
    }),
  );
}
