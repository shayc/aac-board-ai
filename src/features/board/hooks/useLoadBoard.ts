import {
  getAssetUrlByPath,
  getBoardsBatch,
  openBoardsDB,
} from "@features/board/db/boards-db";
import { obfToBoard } from "@features/board/mappers/obf-mapper";
import type { Board } from "@features/board/types";
import { useEffect, useState } from "react";

export interface LoadBoardOptions {
  setId: string;
  boardId: string;
}

export interface LoadBoardReturn {
  board: Board | null;
}

export function useLoadBoard({
  setId,
  boardId,
}: LoadBoardOptions): LoadBoardReturn {
  const [board, setBoard] = useState<Board | null>(null);

  useEffect(() => {
    const loadBoard = async () => {
      try {
        const db = await openBoardsDB();

        try {
          const [boardData] = await getBoardsBatch(db, setId, [boardId]);

          if (!boardData) {
            throw new Error(`Board not found: ${boardId}`);
          }

          const obfBoard = boardData.json;

          if (obfBoard.images) {
            for (const img of obfBoard.images) {
              if (img.path) {
                try {
                  const url = await getAssetUrlByPath(db, setId, img.path);
                  if (url) img.data = url;
                } catch (err) {
                  console.warn(
                    `Failed to load image ${img.id} from path ${img.path}:`,
                    err,
                  );
                }
              }
            }
          }

          if (obfBoard.sounds) {
            for (const sound of obfBoard.sounds) {
              if (sound.path) {
                try {
                  const url = await getAssetUrlByPath(db, setId, sound.path);
                  if (url) sound.data = url;
                } catch (err) {
                  console.warn(
                    `Failed to load sound ${sound.id} from path ${sound.path}:`,
                    err,
                  );
                }
              }
            }
          }

          const newBoard = obfToBoard(obfBoard);

          setBoard(newBoard);
        } finally {
          db.close();
        }
      } catch (err) {
        console.error("Error loading board:", err);
      }
    };

    void loadBoard();
  }, [setId, boardId]);

  return { board };
}
