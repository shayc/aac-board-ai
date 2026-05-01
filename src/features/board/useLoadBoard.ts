import type { ObjectUrlRegistry } from "@shared/utils/object-url";
import { createObjectUrlRegistry } from "@shared/utils/object-url";
import type { OBFBoard, OBFMedia } from "open-board-format";
import { useEffect, useRef, useState } from "react";
import { obfToBoard } from "./import/obf-mapper";
import type { BoardsDB } from "./storage/boards-db";
import { getAssetBlob, getBoard, withBoardsDB } from "./storage/boards-db";
import type { Board } from "./types";

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
  const registryRef = useRef<ObjectUrlRegistry | null>(null);

  useEffect(() => {
    let cancelled = false;
    const registry = createObjectUrlRegistry();

    async function fetchAndApply() {
      if (!setId || !boardId) {
        setBoard(null);
        return;
      }

      try {
        const loaded = await loadBoard({ setId, boardId, registry });
        if (!cancelled) {
          registryRef.current?.revokeAll();
          registryRef.current = registry;
          setBoard(loaded);
        } else {
          registry.revokeAll();
        }
      } catch (err) {
        console.error("Error loading board:", err);
        registry.revokeAll();
        if (!cancelled) {
          setBoard(null);
        }
      }
    }

    void fetchAndApply();

    return () => {
      cancelled = true;
    };
  }, [setId, boardId]);

  useEffect(() => {
    return () => {
      registryRef.current?.revokeAll();
      registryRef.current = null;
    };
  }, []);

  return { board };
}

async function loadBoard({
  setId,
  boardId,
  registry,
}: {
  setId: string;
  boardId: string;
  registry: ObjectUrlRegistry;
}): Promise<Board> {
  const obfBoard = await withBoardsDB(async (db) => {
    const board = await fetchOBFBoard(db, setId, boardId);
    return hydrateBoard(db, setId, board, registry);
  });

  return obfToBoard(obfBoard);
}

async function fetchOBFBoard(
  db: BoardsDB,
  setId: string,
  boardId: string,
): Promise<OBFBoard> {
  const boardData = await getBoard(db, setId, boardId);
  if (!boardData) {
    throw new Error(`Board not found: ${boardId}`);
  }
  return boardData.json;
}

async function hydrateBoard(
  db: BoardsDB,
  setId: string,
  board: OBFBoard,
  registry: ObjectUrlRegistry,
): Promise<OBFBoard> {
  return {
    ...board,
    images: await hydrateAssets(db, setId, board.images, "image", registry),
    sounds: await hydrateAssets(db, setId, board.sounds, "sound", registry),
  };
}

async function hydrateAssets(
  db: BoardsDB,
  setId: string,
  assets: OBFMedia[] | undefined,
  kind: "image" | "sound",
  registry: ObjectUrlRegistry,
): Promise<OBFMedia[] | undefined> {
  if (!assets?.length) {
    return assets;
  }

  const resolvedMedia: OBFMedia[] = [];
  for (const asset of assets) {
    if (!asset.path) {
      resolvedMedia.push(asset);
      continue;
    }

    try {
      const blob = await getAssetBlob(db, setId, asset.path);
      const url = blob ? registry.create(blob) : null;
      resolvedMedia.push(url ? { ...asset, data: url } : asset);
    } catch (err) {
      console.warn(
        `Failed to load ${kind} ${asset.id} from path ${asset.path}:`,
        err,
      );
      resolvedMedia.push(asset);
    }
  }

  return resolvedMedia;
}
