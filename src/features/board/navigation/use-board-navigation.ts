import { isRecord } from "@shared/utils/is-record";
import { useLocation, useMatch, useNavigate } from "react-router";
import { BOARD_ROUTE_PATTERN, boardPath } from "./board-paths";

interface UseBoardRouteReturn {
  boardSetId: string | undefined;
  boardId: string | undefined;
  goToBoard: (targetBoardId: string) => void;
}

export interface UseBoardNavigationReturn {
  canGoBack: boolean;
  canGoHome: boolean;
  isHome: boolean;
  goToBoard: (targetBoardId: string) => void;
  goBack: () => void;
  goHome: () => void;
}

function readCanGoBack(state: unknown): boolean {
  return isRecord(state) && state.canGoBack === true;
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
  const { boardSetId, boardId, goToBoard } = useBoardRoute();

  const canGoBack = readCanGoBack(location.state);
  const canGoHome = Boolean(rootBoardId);
  const isHome = rootBoardId !== undefined && boardId === rootBoardId;

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

  return { canGoBack, canGoHome, isHome, goToBoard, goBack, goHome };
}
