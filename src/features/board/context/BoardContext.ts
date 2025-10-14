import type { UseCommunicationBoardResult } from "@features/board/hooks/useCommunicationBoard";
import { createContext } from "react";

export type BoardContextValue = UseCommunicationBoardResult;

export const BoardContext = createContext<BoardContextValue | undefined>(
  undefined
);
