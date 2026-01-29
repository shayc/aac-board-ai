import { useCommunicationBoard } from "@features/board/hooks/useCommunicationBoard";
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
  const communicationBoard = useCommunicationBoard({
    setId,
    boardId,
  });

  return <BoardContext value={communicationBoard}>{children}</BoardContext>;
}
