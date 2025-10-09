import { use } from "react";
import { BoardContext } from "./BoardContext";

export function useBoard() {
  const context = use(BoardContext);

  if (!context) {
    throw new Error("useBoard must be used within BoardProvider");
  }

  return context;
}
