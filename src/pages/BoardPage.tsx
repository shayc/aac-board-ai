import { Board } from "@features/board/components/Board/Board";
import { BoardProvider } from "@features/board/context/BoardProvider";
import { useParams } from "react-router";

function BoardPage() {
  const params = useParams<{ setId: string; boardId: string }>();

  return (
    <BoardProvider setId={params.setId ?? ""} boardId={params.boardId ?? ""}>
      <Board />
    </BoardProvider>
  );
}

export default BoardPage;
