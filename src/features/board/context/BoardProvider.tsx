import { useCommunicationBoard } from "@features/board/hooks/useCommunicationBoard";
import type { BoardRouteParams } from "@shared/types/routes";
import type { ReactNode } from "react";
import { useParams } from "react-router";
import { BoardContext } from "./BoardContext";

export interface BoardProviderProps {
  children: ReactNode;
}

export function BoardProvider({ children }: BoardProviderProps) {
  const { setId, boardId } = useParams<BoardRouteParams>();

  const communicationBoard = useCommunicationBoard({
    setId: setId ?? "",
    boardId: boardId ?? "",
  });

  return <BoardContext value={communicationBoard}>{children}</BoardContext>;
}
