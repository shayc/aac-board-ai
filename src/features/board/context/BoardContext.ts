import type { CommunicationBoardReturn } from "@features/board/hooks/useCommunicationBoard";
import { createContext } from "react";

export type BoardContextValue = CommunicationBoardReturn;

export const BoardContext = createContext<BoardContextValue | null>(null);
