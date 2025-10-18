import { useCommunicationBoard } from "@features/board/hooks/useCommunicationBoard";
import type { ReactNode } from "react";
import { useParams } from "react-router";
import { BoardContext } from "./BoardContext";

export interface BoardProviderProps {
  children: ReactNode;
}

export function BoardProvider({ children }: BoardProviderProps) {
  const params = useParams<{ setId: string; boardId: string }>();

  const communicationBoard = useCommunicationBoard({
    setId: params.setId || "",
    boardId: params.boardId || "",
  });

  return <BoardContext value={communicationBoard}>{children}</BoardContext>;
}
