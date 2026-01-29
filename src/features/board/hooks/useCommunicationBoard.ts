import type { Board } from "@features/board/types";
import { useBoardTranslation } from "./useBoardTranslation";
import { useLoadBoard } from "./useLoadBoard";

export interface UseCommunicationBoardOptions {
  setId: string;
  boardId: string;
}

export interface UseCommunicationBoardReturn {
  board: Board | null;
}

export function useCommunicationBoard({
  setId,
  boardId,
}: UseCommunicationBoardOptions): UseCommunicationBoardReturn {
  const { board } = useLoadBoard({ setId, boardId });
  const { translatedBoard } = useBoardTranslation({ board });

  return {
    board: translatedBoard,
  };
}
