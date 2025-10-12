import { useCommunicationBoard } from "@features/board/hooks/useCommunicationBoard";
import type { ReactNode } from "react";
import { useParams } from "react-router";
import { BoardContext } from "./BoardContext";

export interface BoardProviderProps {
  children: ReactNode;
}

export function BoardProvider({ children }: BoardProviderProps) {
  const { setId, boardId } = useParams<{ setId: string; boardId: string }>();
  const value = useCommunicationBoard({ setId, boardId });

  return <BoardContext value={value}>{children}</BoardContext>;
}
