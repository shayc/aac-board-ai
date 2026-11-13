import { BOARD_ROUTE_PATTERN, boardPath } from "@features/library";
import { useMatch, useNavigate } from "react-router";

interface UseBoardRouteReturn {
  boardSetId: string | undefined;
  boardId: string | undefined;
  goToBoard: (targetBoardId: string) => void;
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
