import { useLocation, useNavigate, useParams } from "react-router";
import { useBoardSets } from "../board-sets/use-board-sets";
import { boardPath, boardSetPath } from "./board-paths";

export interface BoardRouteParams {
  [key: string]: string;
  setId: string;
  boardId: string;
}

export interface UseBoardNavigationReturn {
  canGoBack: boolean;
  canGoHome: boolean;
  goToBoard: (id: string) => void;
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

  const { setId, boardId } = useParams<BoardRouteParams>();
  const { boardSets } = useBoardSets();
  const rootBoardId = boardSets.find((set) => set.setId === setId)?.rootBoardId;

  const backStack = readBackStack(location.state);

  const canGoBack = backStack.length > 0;
  const canGoHome = Boolean(rootBoardId);

  function goToBoard(id: string) {
    if (!setId || !id || id === boardId) {
      return;
    }

    void navigate(boardPath({ setId, boardId: id }), {
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
    canGoBack,
    canGoHome,
    goToBoard,
    goBack,
    goHome,
  };
}
