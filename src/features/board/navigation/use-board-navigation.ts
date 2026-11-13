import { boardPath } from "@features/library";
import { isRecord } from "@shared/utils/is-record";
import { useLocation, useNavigate } from "react-router";
import { useBoardRoute } from "./use-board-route";

export interface UseBoardNavigationReturn {
  canGoBack: boolean;
  canGoHome: boolean;
  goToBoard: (targetBoardId: string) => void;
  goBack: () => void;
  goHome: () => void;
}

export function useBoardNavigation(
  rootBoardId: string | undefined,
): UseBoardNavigationReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const { boardSetId, goToBoard } = useBoardRoute();

  const canGoBack = readCanGoBack(location.state);
  const canGoHome = Boolean(rootBoardId);

  function goBack() {
    if (!boardSetId || !canGoBack) {
      return;
    }

    void navigate(-1);
  }

  function goHome() {
    if (!boardSetId || !rootBoardId) {
      return;
    }

    void navigate(boardPath({ boardSetId, boardId: rootBoardId }), {
      state: { canGoBack: false },
      replace: true,
    });
  }

  return { canGoBack, canGoHome, goToBoard, goBack, goHome };
}

function readCanGoBack(state: unknown): boolean {
  return isRecord(state) && state.canGoBack === true;
}
