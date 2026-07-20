import {
  createObjectUrlRegistry,
  type ObjectUrlRegistry,
} from "@shared/utils/object-url";
import type { OBFBoard, OBFMedia } from "@shayc/open-board-format";
import { obfToBoard } from "../obf/obf-to-board";
import type { Board } from "../types";
import { BoardNotFoundError, getAssetBlob, getBoard } from "./boards-db";

export interface BoardMediaResource {
  commit(): void;
  dispose(): void;
}

export interface HydratedBoard {
  board: Board;
  media: BoardMediaResource;
}

export async function hydrateBoard(
  setId: string,
  boardId: string,
  signal?: AbortSignal,
): Promise<HydratedBoard> {
  const registry = createObjectUrlRegistry();
  try {
    const obf = await readOBFBoard(setId, boardId);

    signal?.throwIfAborted();

    const hydrated = await hydrateOBFBoard(setId, obf, registry);
    const board = obfToBoard(hydrated);

    signal?.throwIfAborted();

    return { board, media: createBoardMediaResource(registry, signal) };
  } catch (error) {
    registry.revokeAll();
    throw error;
  }
}

function createBoardMediaResource(
  registry: ObjectUrlRegistry,
  signal?: AbortSignal,
): BoardMediaResource {
  let state: "provisional" | "committed" | "disposed" = "provisional";

  function removeAbortListener() {
    signal?.removeEventListener("abort", disposeProvisional);
  }

  function dispose() {
    if (state === "disposed") {
      return;
    }

    state = "disposed";
    removeAbortListener();
    registry.revokeAll();
  }

  function disposeProvisional() {
    if (state === "provisional") {
      dispose();
    }
  }

  signal?.addEventListener("abort", disposeProvisional, { once: true });

  return {
    commit() {
      if (state === "disposed") {
        throw new Error("Cannot commit disposed board media");
      }
      if (state === "committed") {
        return;
      }

      state = "committed";
      removeAbortListener();
    },
    dispose,
  };
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
