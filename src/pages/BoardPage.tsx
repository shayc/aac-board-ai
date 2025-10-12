import { Board } from "@features/board/components/Board/Board";
import { BoardProvider } from "@features/board/context/BoardProvider";
import { useParams } from "react-router";

export function BoardPage() {
  const { setId, boardId } = useParams<{ setId: string; boardId: string }>();

  return (
    <BoardProvider setId={setId} boardId={boardId}>
      <Board />
    </BoardProvider>
  );
}
