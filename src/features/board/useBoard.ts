import { useLoadBoard } from "./storage/useLoadBoard";
import type { Board } from "./types";
import { useBoardTranslation } from "./useBoardTranslation";

export interface UseBoardOptions {
  setId: string;
  boardId: string;
}

export interface UseBoardReturn {
  board: Board | null;
  isLoading: boolean;
  error: Error | null;
}

export function useBoard({ setId, boardId }: UseBoardOptions): UseBoardReturn {
  const { board, isLoading, error } = useLoadBoard({ setId, boardId });
  const { translatedBoard } = useBoardTranslation({ setId, board });

  return {
    board: translatedBoard,
    isLoading,
    error,
  };
}
