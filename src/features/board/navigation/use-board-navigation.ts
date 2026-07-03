import { useLocation, useMatch, useNavigate } from "react-router";
import { useBoardSets } from "../board-sets/use-board-sets";
import { BOARD_ROUTE_PATTERN, boardPath, boardSetPath } from "./board-paths";

export interface UseBoardNavigationReturn {
  setId: string | undefined;
  boardId: string | undefined;
  canGoBack: boolean;
  canGoHome: boolean;
  isHome: boolean;
  goToBoard: (targetBoardId: string) => void;
  goBack: () => void;
  goHome: () => void;
}

const MAX_BACK_STACK = 50;

function readBackStack(state: unknown): string[] {
  if (
    state !== null &&
    typeof state === "object" &&
    "backStack" in state &&
    Array.isArray(state.backStack)
  ) {
    return state.backStack.filter((id) => typeof id === "string");
  }

  return [];
}

export function useBoardNavigation(): UseBoardNavigationReturn {
  const navigate = useNavigate();
  const location = useLocation();

  const match = useMatch(BOARD_ROUTE_PATTERN);
  const { setId, boardId } = match?.params ?? {};
  const { boardSets } = useBoardSets();
  const rootBoardId = boardSets.find(
    (boardSet) => boardSet.setId === setId,
  )?.rootBoardId;

  const backStack = readBackStack(location.state);

  const canGoBack = backStack.length > 0;
  const canGoHome = Boolean(rootBoardId);
  const isHome = rootBoardId !== undefined && boardId === rootBoardId;

  function goToBoard(targetBoardId: string) {
    if (!setId || !targetBoardId || targetBoardId === boardId) {
      return;
    }

    void navigate(boardPath({ setId, boardId: targetBoardId }), {
      state: { backStack: [...backStack, boardId].slice(-MAX_BACK_STACK) },
    });
  }

  function goBack() {
    if (!setId || !canGoBack) {
      return;
    }

    void navigate(-1);
  }

  function goHome() {
    if (!setId || !rootBoardId) {
      return;
    }

    void navigate(boardSetPath({ setId, rootBoardId }), {
      state: { backStack: [] },
      replace: true,
    });
  }

  return {
    setId,
    boardId,
    canGoBack,
    canGoHome,
    isHome,
    goToBoard,
    goBack,
    goHome,
  };
}
