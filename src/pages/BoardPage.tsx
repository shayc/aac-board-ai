import { Board } from "@features/board/components/Board/Board";
import { useCommunicationBoard } from "@features/board/hooks/useCommunicationBoard";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { useParams } from "react-router";

function BoardPage() {
  const params = useParams<{ setId: string; boardId: string }>();

  const { board } = useCommunicationBoard({
    setId: params.setId ?? "",
    boardId: params.boardId ?? "",
  });

  if (!board) {
    return <LoadingIndicator />;
  }

  return <Board board={board} />;
}

export default BoardPage;
