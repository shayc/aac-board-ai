import {
  createObjectUrlRegistry,
  type ObjectUrlRegistry,
} from "@shared/utils/object-url";
import type { OBFBoard, OBFMedia } from "@shayc/open-board-format";
import { obfToBoard } from "../obf/obf-to-board";
import type { Board } from "../types";
import { BoardNotFoundError, getAssetBlob, getBoard } from "./boards-db";

// Module-level because data-mode loaders have no unmount to hook into. Loader
// calls are not serialized — a new navigation can start hydrating before the
// previous one settles — and a superseded call must never revoke the live
// board's URLs. Each call builds URLs in its own registry, checks the abort
// signal after every await, and swaps into `previousRegistry` synchronously
// only if it wins; a superseded call throws first and revokes only its own
// registry. Single concurrent caller assumed — the only consumer is boardLoader.
let previousRegistry: ObjectUrlRegistry | null = null;

export async function hydrateBoard(
  setId: string,
  boardId: string,
  signal?: AbortSignal,
): Promise<Board> {
  const registry = createObjectUrlRegistry();
  try {
    const obf = await readOBFBoard(setId, boardId);

    signal?.throwIfAborted();

    const hydrated = await hydrateOBFBoard(setId, obf, registry);
    const board = obfToBoard(hydrated);

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
