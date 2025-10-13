import { useState } from "react";

export interface UseNavigationOptions {
  rootBoardId: string;
}

export function useNavigation(options: UseNavigationOptions) {
  const { rootBoardId } = options;

  const [currentBoardId, setCurrentBoardId] = useState(rootBoardId);
  const [history, setHistory] = useState<string[]>([]);
  const canGoBack = history.length > 0;

  const goToBoard = (boardId: string) => {
    setHistory((prev) => [...prev, boardId]);
    setCurrentBoardId(boardId);
  };

  const goBack = () => {
    if (!canGoBack) {
      return;
    }

    const prevId = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentBoardId(prevId);
  };

  const goHome = () => {
    setHistory([]);
    setCurrentBoardId(rootBoardId);
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
