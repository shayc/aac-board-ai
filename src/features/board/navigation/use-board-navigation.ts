import { isRecord } from "@shared/utils/is-record";
import { useLocation, useMatch, useNavigate } from "react-router";
import { useBoardSets } from "../board-sets/board-sets-store";
import { BOARD_ROUTE_PATTERN, boardPath } from "./board-paths";

export interface UseBoardNavigationReturn {
  boardSetId: string | undefined;
  boardId: string | undefined;
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

export function useBoardNavigation(): UseBoardNavigationReturn {
  const navigate = useNavigate();
  const location = useLocation();

  const match = useMatch(BOARD_ROUTE_PATTERN);
  const { boardSetId, boardId } = match?.params ?? {};
  const { boardSets } = useBoardSets();
  const rootBoardId = boardSets.find(
    (boardSet) => boardSet.id === boardSetId,
  )?.rootBoardId;

  const canGoBack = readCanGoBack(location.state);
  const canGoHome = Boolean(rootBoardId);
  const isHome = rootBoardId !== undefined && boardId === rootBoardId;

  function goToBoard(targetBoardId: string) {
    if (!boardSetId || !targetBoardId || targetBoardId === boardId) {
      return;
    }

    void navigate(boardPath({ boardSetId, boardId: targetBoardId }), {
      state: { canGoBack: true },
    });
  }

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

  return {
    boardSetId,
    boardId,
    canGoBack,
    canGoHome,
    isHome,
    goToBoard,
    goBack,
    goHome,
  };
}
