import {
  createObjectUrlRegistry,
  type ObjectUrlRegistry,
} from "@shared/utils/object-url";
import type { OBFBoard, OBFMedia } from "open-board-format";
import { data, type LoaderFunctionArgs } from "react-router";
import { obfToBoard } from "../obf/mapper";
import type { Board } from "../types";
import {
  getAssetBlob,
  getBoard,
  withBoardsDB,
  type BoardsDB,
} from "./boards-db";

export interface BoardLoaderData {
  setId: string;
  board: Board;
}

// Module-scoped pointer to the registry the previous loader call created.
// Revoking on the next loader run (rather than on React unmount) keeps URL
// lifecycle outside React entirely — required because StrictMode dev double-
// invokes effect cleanups, which would otherwise revoke URLs the component
// is still about to render.
let previousRegistry: ObjectUrlRegistry | null = null;

export async function boardLoader({
  params,
}: LoaderFunctionArgs): Promise<BoardLoaderData> {
  const setId = params.setId ?? "";
  const boardId = params.boardId ?? "";
  if (!setId || !boardId) {
    // React Router catches thrown `data()` and routes it to ErrorBoundary as
    // a route error response — the v7-canonical way to signal an expected 4xx.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw data("Missing route params", { status: 400 });
  }

  previousRegistry?.revokeAll();
  previousRegistry = null;

  const registry = createObjectUrlRegistry();
  try {
    const board = await withBoardsDB(async (db) => {
      const obf = await fetchOBFBoard(db, setId, boardId);
      const hydrated = await hydrateBoard(db, setId, obf, registry);
      return obfToBoard(hydrated);
    });
    previousRegistry = registry;
    return { setId, board };
  } catch (err) {
    registry.revokeAll();
    if (err instanceof Error && err.message.startsWith("Board not found")) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw data("Board not found", { status: 404 });
    }
    throw err;
  }
}

async function fetchOBFBoard(
  db: BoardsDB,
  setId: string,
  boardId: string,
): Promise<OBFBoard> {
  const record = await getBoard(db, setId, boardId);
  if (!record) {
    throw new Error(`Board not found: ${setId}/${boardId}`);
  }
  return record.obf;
}

async function hydrateBoard(
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
