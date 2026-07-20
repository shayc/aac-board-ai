import { BoardViewer, type HydratedBoard } from "@features/board";
import { useLoaderData } from "react-router";

export function BoardPage() {
  const { board } = useLoaderData<HydratedBoard>();

  return (
    <>
      <title>{board.name}</title>
      <BoardViewer board={board} />
    </>
  );
}
