import { createContext } from "react";
import type { UseCommunicationBoardResult } from "../hooks/useCommunicationBoard";

export type BoardContextValue = UseCommunicationBoardResult;

export const BoardContext = createContext<BoardContextValue | undefined>(
  undefined
);
