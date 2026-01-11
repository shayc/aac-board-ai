import { getBoardSet, openBoardsDB } from "@features/board/db/boards-db";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

interface NavigationState {
  history: string[];
  index: number;
}

export interface UseBoardNavigationReturn {
  history: string[];
  canGoBack: boolean;
  canGoHome: boolean;
  goToBoard: (id: string) => void;
  goBack: () => void;
  goHome: () => void;
}

export function useBoardNavigation(): UseBoardNavigationReturn {
  const navigate = useNavigate();

  const { setId, boardId } = useParams();
  const [rootBoardId, setRootBoardId] = useState("");

  const [navState, setNavState] = useState<NavigationState>({
    history: boardId ? [boardId] : [],
    index: 0,
  });

  const canGoBack = navState.index > 0;
  const canGoHome = rootBoardId !== "";

  function goToBoard(id: string) {
    if (!setId) {
      return;
    }

    if (!id || id === navState.history[navState.index]) {
      return;
    }

    setNavState((prev) => {
      const next = prev.history.slice(0, prev.index + 1).concat(id);
      return {
        ...prev,
        history: next,
        index: next.length - 1,
      };
    });

    void navigate(`/sets/${setId}/boards/${id}`);
  }

  function goBack() {
    if (!setId) {
      return;
    }

    if (!canGoBack) {
      return;
    }

    const newIndex = navState.index - 1;
    const id = navState.history[newIndex];

    setNavState((prev) => ({
      ...prev,
      index: newIndex,
    }));

    void navigate(`/sets/${setId}/boards/${id}`);
  }

  function goHome() {
    if (!setId) {
      return;
    }

    if (!rootBoardId) {
      return;
    }

    setNavState((prev) => ({
      ...prev,
      history: [rootBoardId],
      index: 0,
    }));

    void navigate(`/sets/${setId}/boards/${rootBoardId}`);
  }

  useEffect(() => {
    async function loadRootBoard() {
      if (!setId) {
        return;
      }

      const db = await openBoardsDB();

      try {
        const boardSet = await getBoardSet(db, setId);

        if (boardSet?.rootBoardId) {
          setRootBoardId(boardSet.rootBoardId);
        } else {
          setRootBoardId("");
        }
      } catch (error) {
        console.error("Failed to load board:", error);
        setRootBoardId("");
      } finally {
        db.close();
      }
    }

    void loadRootBoard();
  }, [setId]);

  return {
    history: navState.history,
    canGoBack,
    canGoHome,
    goToBoard,
    goBack,
    goHome,
  };
}
