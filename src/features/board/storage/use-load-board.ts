import type { ObjectUrlRegistry } from "@shared/utils/object-url";
import { createObjectUrlRegistry } from "@shared/utils/object-url";
import type { OBFBoard, OBFMedia } from "open-board-format";
import { useEffect, useRef, useState } from "react";
import { obfToBoard } from "../obf/mapper";
import type { Board } from "../types";
import type { BoardsDB } from "./boards-db";
import { getAssetBlob, getBoard, withBoardsDB } from "./boards-db";

export interface UseLoadBoardOptions {
  setId: string;
  boardId: string;
}

export interface UseLoadBoardReturn {
  board: Board | null;
  isLoading: boolean;
  error: Error | null;
}

export function useLoadBoard({
  setId,
  boardId,
}: UseLoadBoardOptions): UseLoadBoardReturn {
  const [board, setBoard] = useState<Board | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const registryRef = useRef<ObjectUrlRegistry | null>(null);

  useEffect(() => {
    let cancelled = false;
    const registry = createObjectUrlRegistry();

    async function fetchAndApply() {
      if (!setId || !boardId) {
        registryRef.current?.revokeAll();
        registryRef.current = null;
        setBoard(null);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const loaded = await loadBoard({ setId, boardId, registry });
        if (!cancelled) {
          registryRef.current?.revokeAll();
          registryRef.current = registry;
          setBoard(loaded);
          setIsLoading(false);
        } else {
          registry.revokeAll();
        }
      } catch (err) {
        registry.revokeAll();
        if (!cancelled) {
          setBoard(null);
          setIsLoading(false);
          setError(err instanceof Error ? err : new Error(String(err)));
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

  return { board, isLoading, error };
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
    throw new Error(`Board not found: ${setId}/${boardId}`);
  }
  return boardData.obf;
}

async function hydrateBoard(
  db: BoardsDB,
  setId: string,
  board: OBFBoard,
  registry: ObjectUrlRegistry,
): Promise<OBFBoard> {
  const [images, sounds] = await Promise.all([
    hydrateAssets(db, setId, board.images, "image", registry),
    hydrateAssets(db, setId, board.sounds, "sound", registry),
  ]);

  return { ...board, images, sounds };
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

  return Promise.all(
    assets.map(async (asset) => {
      if (!asset.path) {
        return asset;
      }

      try {
        const blob = await getAssetBlob(db, setId, asset.path);
        const url = blob ? registry.create(blob) : null;
        return url ? { ...asset, data: url } : asset;
      } catch (err) {
        console.warn(
          `Failed to load ${kind} ${asset.id} from path ${asset.path}:`,
          err,
        );
        return asset;
      }
    }),
  );
}
