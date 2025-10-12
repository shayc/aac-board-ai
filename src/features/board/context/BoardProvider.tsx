import { useCommunicationBoard } from "@features/board/hooks/useCommunicationBoard";
import type { ReactNode } from "react";
import { useParams } from "react-router";
import { BoardContext } from "./BoardContext";

export interface BoardProviderProps {
  children: ReactNode;
}

export function BoardProvider({ children }: BoardProviderProps) {
  const params = useParams<{ setId: string; boardId: string }>();
  console.log("[BoardProvider] Full params object:", params);
  console.log("[BoardProvider] setId:", params.setId, "boardId:", params.boardId);
  console.log("[BoardProvider] Current location:", window.location.pathname);
  console.log("[BoardProvider] Render count - timestamp:", new Date().toISOString());
  
  const value = useCommunicationBoard({ setId: params.setId, boardId: params.boardId });

  return <BoardContext value={value}>{children}</BoardContext>;
}
