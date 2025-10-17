import type { UseCommunicationBoardReturn } from "@features/board/hooks/useCommunicationBoard";
import { createContext } from "react";

export type BoardContextValue = UseCommunicationBoardReturn;

export const BoardContext = createContext<BoardContextValue | undefined>(
  undefined
);
