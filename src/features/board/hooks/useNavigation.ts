import { useState } from "react";
import { useNavigate, useParams } from "react-router";

export interface UseNavigationOptions {
  rootBoardId: string;
}

export function useNavigation(options: UseNavigationOptions) {
  const { rootBoardId } = options;
  const { setId } = useParams();
  const navigate = useNavigate();

  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  const canGoBack = navigationHistory.length > 0;

  const navigateToBoard = (id: string) => {
    setNavigationHistory((prev) => [...prev, id]);
    navigate(`/sets/${setId}/boards/${id}`);
  };

  const navigateBack = () => {
    if (!canGoBack) {
      return;
    }

    const prevId = navigationHistory[navigationHistory.length - 1];
    setNavigationHistory((prev) => prev.slice(0, -1));
    navigate(`/sets/${setId}/boards/${prevId}`);
  };

  const navigateHome = () => {
    setNavigationHistory([]);
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
