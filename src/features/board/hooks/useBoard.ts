import type { Board } from "../types";
import { useBoardTranslation } from "./useBoardTranslation";
import { useLoadBoard } from "./useLoadBoard";

export interface UseBoardOptions {
  setId: string;
  boardId: string;
}

export interface UseBoardReturn {
  board: Board | null;
}

export function useBoard({ setId, boardId }: UseBoardOptions): UseBoardReturn {
  const { board } = useLoadBoard({ setId, boardId });
  const { translatedBoard } = useBoardTranslation({ setId, board });

  return {
    board: translatedBoard,
  };
}
