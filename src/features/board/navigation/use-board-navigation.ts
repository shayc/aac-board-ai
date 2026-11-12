import { BOARD_ROUTE_PATTERN, boardPath } from "@features/library";
import { isRecord } from "@shared/utils/is-record";
import { useLocation, useMatch, useNavigate } from "react-router";

interface UseBoardRouteReturn {
  boardSetId: string | undefined;
  boardId: string | undefined;
  goToBoard: (targetBoardId: string) => void;
}

export interface UseBoardNavigationReturn {
  canGoBack: boolean;
  canGoHome: boolean;
  goToBoard: (targetBoardId: string) => void;
  goBack: () => void;
  goHome: () => void;
}

export function useBoardRoute(): UseBoardRouteReturn {
  const navigate = useNavigate();
  const match = useMatch(BOARD_ROUTE_PATTERN);
  const { boardSetId, boardId } = match?.params ?? {};

  function goToBoard(targetBoardId: string) {
    if (!boardSetId || !targetBoardId || targetBoardId === boardId) {
      return;
    }

    void navigate(boardPath({ boardSetId, boardId: targetBoardId }), {
      state: { canGoBack: true },
    });
  }

  return { boardSetId, boardId, goToBoard };
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
