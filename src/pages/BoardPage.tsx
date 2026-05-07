import { usePageTitle } from "@app/usePageTitle";
import { BoardView, useBoard, type BoardRouteParams } from "@features/board";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { useEffect } from "react";
import { useParams } from "react-router";

function BoardPage() {
  const { setId = "", boardId = "" } = useParams<BoardRouteParams>();
  const { board } = useBoard({ setId, boardId });
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle(board?.name);
  }, [setPageTitle, board?.name]);

  if (!board) {
    return <LoadingIndicator />;
  }

  return <BoardView board={board} />;
}

export default BoardPage;
