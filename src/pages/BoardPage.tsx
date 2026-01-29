import { Board } from "@features/board/components/Board/Board";
import { useBoard } from "@features/board/hooks/useBoard";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { useParams } from "react-router";

function BoardPage() {
  const params = useParams<{ setId: string; boardId: string }>();

  const { board } = useBoard({
    setId: params.setId ?? "",
    boardId: params.boardId ?? "",
  });

  if (!board) {
    return <LoadingIndicator />;
  }

  return <Board board={board} />;
}

export default BoardPage;
