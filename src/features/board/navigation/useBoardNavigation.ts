import {
  generatePath,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import type { BoardRouteParams } from "../types";
import { useBoardSets } from "../storage/useBoardSets";

export interface UseBoardNavigationReturn {
  canGoBack: boolean;
  canGoHome: boolean;
  goToBoard: (id: string) => void;
  goBack: () => void;
  goHome: () => void;
}

function getBackStack(state: unknown): string[] {
  if (
    state !== null &&
    typeof state === "object" &&
    "backStack" in state &&
    Array.isArray(state.backStack)
  ) {
    return state.backStack as string[];
  }

  return [];
}

export function useBoardNavigation(): UseBoardNavigationReturn {
  const navigate = useNavigate();
  const location = useLocation();

  const { setId, boardId } = useParams<BoardRouteParams>();
  const { boardSets } = useBoardSets();
  const rootBoardId =
    boardSets.find((s) => s.setId === setId)?.rootBoardId ?? "";

  const backStack = getBackStack(location.state);

  const canGoBack = backStack.length > 0;
  const canGoHome = rootBoardId !== "";

  function goToBoard(id: string) {
    if (!setId || !id || id === boardId) {
      return;
    }

    void navigate(
      generatePath("/sets/:setId/boards/:boardId", { setId, boardId: id }),
      {
        state: { backStack: [...backStack, boardId] },
      },
    );
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

    void navigate(
      generatePath("/sets/:setId/boards/:boardId", {
        setId,
        boardId: rootBoardId,
      }),
      {
        state: { backStack: [] },
        replace: true,
      },
    );
  }

  return {
    canGoBack,
    canGoHome,
    goToBoard,
    goBack,
    goHome,
  };
}
