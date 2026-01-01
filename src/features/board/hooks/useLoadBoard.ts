import {
  getAssetUrlByPath,
  getBoardsBatch,
  openBoardsDB,
} from "@features/board/db/boards-db";
import { obfToBoard } from "@features/board/mappers/obf-mapper";
import type { Board } from "@features/board/types";
import type { OBFBoard, OBFMedia } from "@shared/open-board-format/schema";
import type { IDBPDatabase } from "idb";
import type { BoardsDBSchema } from "@features/board/db/boards-db";
import { useEffect, useState } from "react";

export interface UseLoadBoardOptions {
  setId: string;
  boardId: string;
}

export interface UseLoadBoardReturn {
  board: Board | null;
}

export function useLoadBoard({
  setId,
  boardId,
}: UseLoadBoardOptions): UseLoadBoardReturn {
  const [board, setBoard] = useState<Board | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!setId || !boardId) {
        setBoard(null);
        return;
      }

      try {
        const loaded = await loadBoard({ setId, boardId });
        if (!cancelled) {
          setBoard(loaded);
        }
      } catch (err) {
        console.error("Error loading board:", err);
        if (!cancelled) {
          setBoard(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setId, boardId]);

  return { board };
}

async function loadBoard({
  setId,
  boardId,
}: {
  setId: string;
  boardId: string;
}): Promise<Board> {
  const obf = await withBoardsDB(async (db) => {
    const board = await fetchOBFBoard(db, setId, boardId);
    return hydrateBoard(db, setId, board);
  });

  return obfToBoard(obf);
}

async function withBoardsDB<T>(
  fn: (db: IDBPDatabase<BoardsDBSchema>) => Promise<T>,
): Promise<T> {
  const db = await openBoardsDB();
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

async function fetchOBFBoard(
  db: IDBPDatabase<BoardsDBSchema>,
  setId: string,
  boardId: string,
): Promise<OBFBoard> {
  const [boardData] = await getBoardsBatch(db, setId, [boardId]);
  if (!boardData) {
    throw new Error(`Board not found: ${boardId}`);
  }
  return boardData.json;
}

async function hydrateBoard(
  db: IDBPDatabase<BoardsDBSchema>,
  setId: string,
  board: OBFBoard,
): Promise<OBFBoard> {
  return {
    ...board,
    images: await hydrateAssets(db, setId, board.images, "image"),
    sounds: await hydrateAssets(db, setId, board.sounds, "sound"),
  };
}

async function hydrateAssets(
  db: IDBPDatabase<BoardsDBSchema>,
  setId: string,
  assets: OBFMedia[] | undefined,
  kind: "image" | "sound",
): Promise<OBFMedia[] | undefined> {
  if (!assets?.length) {
    return assets;
  }

  const out: OBFMedia[] = [];
  for (const asset of assets) {
    if (!asset.path) {
      out.push(asset);
      continue;
    }

    try {
      const url = await getAssetUrlByPath(db, setId, asset.path);
      out.push(url ? { ...asset, data: url } : asset);
    } catch (err) {
      console.warn(
        `Failed to load ${kind} ${asset.id} from path ${asset.path}:`,
        err,
      );
      out.push(asset);
    }
  }

  return out;
}
