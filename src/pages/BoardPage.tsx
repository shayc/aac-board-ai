import { useDeclareHeaderTitle } from "@app/useHeaderTitle";
import { BoardView, useBoard, type BoardRouteParams } from "@features/board";
import { ErrorState } from "@shared/components/ErrorState";
import { LoadingState } from "@shared/components/LoadingState";
import { useParams } from "react-router";

function BoardPage() {
  const { setId = "", boardId = "" } = useParams<BoardRouteParams>();
  const { board, error } = useBoard({ setId, boardId });

  useDeclareHeaderTitle(board?.name);

  if (error) {
    return <ErrorState title="Failed to load board" message={error.message} />;
  }

  if (!board) {
    return <LoadingState />;
  }

  return <BoardView board={board} />;
}

export default BoardPage;
