import { usePageTitle } from "@app/hooks/usePageTitle";
import { BoardView } from "@features/board/components/BoardView/BoardView";
import { useBoard } from "@features/board/hooks/useBoard";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { useParams } from "react-router";
import { useEffect } from "react";
import type { BoardRouteParams } from "@features/board/types";

function BoardPage() {
  const params = useParams<BoardRouteParams>();

  const { board } = useBoard({
    setId: params.setId ?? "",
    boardId: params.boardId ?? "",
  });

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
