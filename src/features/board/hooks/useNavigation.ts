import { getBoardset, openBoardsDB } from "@features/board/db/boards-db";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

interface NavigationState {
  history: string[];
  index: number;
}

export function useNavigation() {
  const navigate = useNavigate();

  const { setId, boardId } = useParams();
  const [rootBoardId, setRootBoardId] = useState("");

  const [navState, setNavState] = useState<NavigationState>({
    history: boardId ? [boardId] : [],
    index: 0,
  });

  const canGoBack = navState.index > 0;
  const canGoHome = rootBoardId !== "";

  function navigateToBoard(id: string) {
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

  function navigateBack() {
    if (!canGoBack) {
      return;
    }

    const id = navState.history[navState.index - 1];

    setNavState((prev) => {
      const next = prev.history.slice(0, prev.index).concat(id);

      return {
        ...prev,
        history: next,
        index: next.length - 1,
      };
    });

    void navigate(`/sets/${setId}/boards/${id}`);
  }

  function navigateHome() {
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
        const boardset = await getBoardset(db, setId);

        if (boardset?.rootBoardId) {
          setRootBoardId(boardset.rootBoardId);
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
    navigationHistory: navState.history,
    navigationIndex: navState.index,
    canGoBack,
    canGoHome,
    navigateToBoard,
    navigateBack,
    navigateHome,
  };
}
