import { useDeclareHeaderTitle } from "@app/use-header-title";
import { BoardViewer, useBoard, type BoardRouteParams } from "@features/board";
import { ErrorState } from "@shared/components/error-state";
import { LoadingState } from "@shared/components/loading-state";
import { useParams } from "react-router";

function BoardPage() {
  const { setId = "", boardId = "" } = useParams<BoardRouteParams>();
  const { board, error } = useBoard({ setId, boardId });

  useDeclareHeaderTitle(board?.name);

  if (error) {
    return (
      <ErrorState
        title="Couldn't load board"
        description="This board may be missing or corrupted."
      />
    );
  }

  if (!board) {
    return <LoadingState message="Loading board..." />;
  }

  return (
    <>
      <title>{board.name}</title>
      <BoardViewer board={board} />
    </>
  );
}

export default BoardPage;
