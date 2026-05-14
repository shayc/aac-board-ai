import { useDeclareHeaderTitle } from "@app/useHeaderTitle";
import { BoardViewer, useBoard, type BoardRouteParams } from "@features/board";
import { ErrorState } from "@shared/components/ErrorState";
import { LoadingState } from "@shared/components/LoadingState";
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
