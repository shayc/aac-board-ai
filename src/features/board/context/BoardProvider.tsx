import { useBoard } from "@features/board/hooks/useBoard";
import type { ReactNode } from "react";
import { BoardContext } from "./BoardContext";

export interface BoardProviderProps {
  setId: string;
  boardId: string;
  children: ReactNode;
}

export function BoardProvider({
  setId,
  boardId,
  children,
}: BoardProviderProps) {
  const board = useBoard({
    setId,
    boardId,
  });

  return <BoardContext value={board}>{children}</BoardContext>;
}
