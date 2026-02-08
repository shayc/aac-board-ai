import { BoardPlayer } from "@features/board/components/BoardPlayer/BoardPlayer";
import { useBoard } from "@features/board/hooks/useBoard";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { useParams } from "react-router";
import type { BoardRouteParams } from "@app/AppRoutes";

function BoardPage() {
  const params = useParams<BoardRouteParams>();

  const { board } = useBoard({
    setId: params.setId ?? "",
    boardId: params.boardId ?? "",
  });

  if (!board) {
    return <LoadingIndicator />;
  }

  return <BoardPlayer board={board} />;
}

export default BoardPage;
