import { useState } from "react";
import { useNavigate, useParams } from "react-router";

export interface UseNavigationOptions {
  rootBoardId: string;
}

export function useNavigation(options: UseNavigationOptions) {
  const { rootBoardId } = options;
  const { setId } = useParams();
  const navigate = useNavigate();

  const [currentBoardId, setCurrentBoardId] = useState(rootBoardId);
  const [history, setHistory] = useState<string[]>([]);

  const canGoBack = history.length > 0;

  const goToBoard = (boardId: string) => {
    setHistory((prev) => [...prev, currentBoardId]); // store current before moving
    setCurrentBoardId(boardId);
    navigate(`/sets/${setId}/boards/${boardId}`);
  };

  const goBack = () => {
    if (!canGoBack) return;

    const prevId = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentBoardId(prevId);
    navigate(`/sets/${setId}/boards/${prevId}`);
  };

  const goHome = () => {
    setHistory([]);
    setCurrentBoardId(rootBoardId);
    navigate(`/sets/${setId}/boards/${rootBoardId}`);
  };

  return {
    currentBoardId,
    history,
    canGoBack,
    goToBoard,
    goBack,
    goHome,
  };
}
