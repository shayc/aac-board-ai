import { Board } from "@features/board/components/Board/Board";
import { useParams } from "react-router";

export function BoardPage() {
  const params = useParams<{ setId: string; boardId: string }>();
  console.log("[BoardPage] Params available here:", params);
  console.log("[BoardPage] setId:", params.setId, "boardId:", params.boardId);
  
  return <Board />;
}
