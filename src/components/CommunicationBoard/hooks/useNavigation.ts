import { useState } from "react";
import type { Board } from "../types";

export interface UseNavigationOptions {
  initialBoardId: string;
  boards: Map<string, Board>;
}

/**
 * Standalone hook for managing board navigation.
 * Contains its own state and provides navigation actions.
 */
export function useNavigation(options: UseNavigationOptions) {
  const { initialBoardId, boards } = options;

  const [currentBoardId, setCurrentBoardId] = useState(initialBoardId);
  const [history, setHistory] = useState<string[]>([]);

  const goToBoard = (boardId: string) => {
    setHistory((prev) => [...prev, currentBoardId]);
    setCurrentBoardId(boardId);
  };

  const goBack = () => {
    if (history.length === 0) return;
    
    const prevId = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentBoardId(prevId);
  };

  const goHome = () => {
    setHistory([]);
    setCurrentBoardId(initialBoardId);
  };

  return {
    currentBoardId,
    currentBoard: boards.get(currentBoardId) ?? null,
    history,
    canGoBack: history.length > 0,
    goToBoard,
    goBack,
    goHome,
  };
}