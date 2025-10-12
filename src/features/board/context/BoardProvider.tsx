import { useCommunicationBoard } from "@features/board/hooks/useCommunicationBoard";
import type { ReactNode } from "react";
import { BoardContext } from "./BoardContext";

export interface BoardProviderProps {
  children: ReactNode;
  setId?: string;
  boardId?: string;
}

/**
 * Provider component that initializes and provides board context.
 * All logic is delegated to useCommunicationBoard hook.
 */
export function BoardProvider({
  children,
  setId,
  boardId,
}: BoardProviderProps) {
  const value = useCommunicationBoard({ setId, boardId });

  return <BoardContext value={value}>{children}</BoardContext>;
}
