import { useLocation, useMatch, useNavigate } from "react-router";
import { useBoardSets } from "../board-sets/use-board-sets";
import { BOARD_ROUTE_PATTERN, boardPath, rootBoardPath } from "./board-paths";

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

function readCanGoBack(state: unknown): boolean {
  if (state === null || typeof state !== "object") {
    return false;
  }

  if ("canGoBack" in state) {
    return state.canGoBack === true;
  }

  // Browser history can retain entries written before an app update.
  return (
    "backStack" in state &&
    Array.isArray(state.backStack) &&
    state.backStack.some((id) => typeof id === "string")
  );
}

export function useBoardNavigation(): UseBoardNavigationReturn {
  const navigate = useNavigate();
  const location = useLocation();

  const match = useMatch(BOARD_ROUTE_PATTERN);
  const { setId, boardId } = match?.params ?? {};
  const { boardSets } = useBoardSets();
  const rootBoardId = boardSets.find(
    (boardSet) => boardSet.id === setId,
  )?.rootBoardId;

  const canGoBack = readCanGoBack(location.state);
  const canGoHome = Boolean(rootBoardId);
  const isHome = rootBoardId !== undefined && boardId === rootBoardId;

  function goToBoard(targetBoardId: string) {
    if (!setId || !targetBoardId || targetBoardId === boardId) {
      return;
    }

    void navigate(boardPath({ setId, boardId: targetBoardId }), {
      state: { canGoBack: true },
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

    void navigate(rootBoardPath({ id: setId, rootBoardId }), {
      state: { canGoBack: false },
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
