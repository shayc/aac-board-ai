import { PageTitle } from "@app/layouts/page-title";
import { BoardViewer, type Board } from "@features/board";
import { useLoaderData } from "react-router";

export const Component = function BoardPage() {
  const board = useLoaderData<Board>();

  return (
    <>
      <PageTitle>{board.name}</PageTitle>
      <BoardViewer board={board} />
    </>
  );
};
