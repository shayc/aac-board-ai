import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getBoardset, openBoardsDB } from "../db/boards-db";

export function useNavigation() {
  const { setId } = useParams();
  const [rootBoardId, setRootBoardId] = useState("");
  const navigate = useNavigate();

  const [history, setHistory] = useState<string[]>([]);
  const [index, setIndex] = useState(0);

  const currentId = history[index];

  const canGoBack = index > 0;
  const canGoForward = index < history.length - 1;

  function navigateToBoard(id: string) {
    if (!id || id === currentId) {
      return;
    }

    setHistory((prev) => {
      const next = prev.slice(0, index + 1).concat(id);
      setIndex(next.length - 1);

      return next;
    });

    navigate(`/sets/${setId}/boards/${id}`);
  }

  function navigateBack() {
    if (!canGoBack) {
      return;
    }

    setIndex((i) => i - 1);
    navigate(`/sets/${setId}/boards/${history[index - 1]}`);
  }

  function navigateForward() {
    if (!canGoForward) {
      return;
    }

    setIndex((i) => i + 1);
    navigate(`/sets/${setId}/boards/${history[index + 1]}`);
  }

  function navigateHome() {
    setHistory([rootBoardId]);
    setIndex(0);

    navigate(`/sets/${setId}/boards/${rootBoardId}`);
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
        setRootBoardId("");
      } finally {
        db.close();
      }
    }

    loadRootBoard();
  }, [setId]);

  return {
    navigationHistory: history,
    navigationIndex: index,
    canGoBack,
    canGoForward,
    navigateToBoard,
    navigateBack,
    navigateForward,
    navigateHome,
  };
}
