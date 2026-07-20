import { BoardViewer, type Board } from "@features/board";
import { useLoaderData } from "react-router";

export function BoardPage() {
  const board = useLoaderData<Board>();

  return (
    <>
      <title>{board.name}</title>
      <BoardViewer board={board} />
    </>
  );
}
