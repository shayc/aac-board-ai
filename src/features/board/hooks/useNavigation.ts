import { useState } from "react";

export interface UseNavigationOptions {
  initialBoardId: string;
}

export function useNavigation(options: UseNavigationOptions) {
  const { initialBoardId } = options;

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
    history,
    canGoBack: history.length > 0,
    goToBoard,
    goBack,
    goHome,
  };
}
