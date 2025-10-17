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
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  const canGoBack = navigationHistory.length > 0;

  const navigateToBoard = (boardId: string) => {
    setNavigationHistory((prev) => [...prev, currentBoardId]); // store current before moving
    setCurrentBoardId(boardId);
    navigate(`/sets/${setId}/boards/${boardId}`);
  };

  const navigateBack = () => {
    if (!canGoBack) return;

    const prevId = navigationHistory[navigationHistory.length - 1];
    setNavigationHistory((prev) => prev.slice(0, -1));
    setCurrentBoardId(prevId);
    navigate(`/sets/${setId}/boards/${prevId}`);
  };

  const navigateHome = () => {
    setNavigationHistory([]);
    setCurrentBoardId(rootBoardId);
    navigate(`/sets/${setId}/boards/${rootBoardId}`);
  };

  return {
    navigationHistory,
    canGoBack,
    navigateToBoard,
    navigateBack,
    navigateHome,
  };
}
