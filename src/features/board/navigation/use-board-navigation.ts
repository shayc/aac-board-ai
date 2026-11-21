import { boardPath } from "@features/library";
import { useNavigate } from "react-router";
import { useBoardRoute } from "./use-board-route";

export interface UseBoardNavigationReturn {
  canGoHome: boolean;
  goToBoard: (targetBoardId: string) => void;
  goHome: () => void;
}

export function useBoardNavigation(
  rootBoardId: string | undefined,
): UseBoardNavigationReturn {
  const navigate = useNavigate();
  const { boardSetId, boardId, goToBoard } = useBoardRoute();

  const canGoHome = Boolean(rootBoardId) && boardId !== rootBoardId;

  function goHome() {
    if (!boardSetId || !rootBoardId) {
      return;
    }

    void navigate(boardPath({ boardSetId, boardId: rootBoardId }), {
      replace: true,
    });
  }

  return { canGoHome, goToBoard, goHome };
}
