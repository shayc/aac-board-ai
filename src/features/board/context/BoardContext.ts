import type { BoardContextValue } from "@features/board/types";
import { createContext } from "react";

export const BoardContext = createContext<BoardContextValue | undefined>(
  undefined
);
