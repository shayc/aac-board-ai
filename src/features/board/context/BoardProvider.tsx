import type { ReactNode } from "react";
import { useCommunicationBoard } from "../../components/CommunicationBoard/hooks/useCommunicationBoard";
import { BoardContext } from "./BoardContext";

export interface BoardProviderProps {
  children: ReactNode;
  initialBoardId?: string;
}

/**
 * Provider component that initializes and provides board context.
 * All logic is delegated to useCommunicationBoard hook.
 */
export function BoardProvider({
  children,
  initialBoardId = "lots_of_stuff",
}: BoardProviderProps) {
  const value = useCommunicationBoard({ initialBoardId });

  return <BoardContext value={value}>{children}</BoardContext>;
}
