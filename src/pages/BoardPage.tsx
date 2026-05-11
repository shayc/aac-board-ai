import { useDeclareHeaderTitle } from "@app/useHeaderTitle";
import { BoardView, useBoard, type BoardRouteParams } from "@features/board";
import { ErrorFallback } from "@shared/components/ErrorFallback";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { useParams } from "react-router";

function BoardPage() {
  const { setId = "", boardId = "" } = useParams<BoardRouteParams>();
  const { board, error } = useBoard({ setId, boardId });

  useDeclareHeaderTitle(board?.name);

  if (error) {
    return (
      <ErrorFallback title="Failed to load board" message={error.message} />
    );
  }

  if (!board) {
    return <LoadingIndicator />;
  }

  return <BoardView board={board} />;
}

export default BoardPage;
