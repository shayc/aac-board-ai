import {
  BoardViewer,
  type Board,
  type BoardRouteParams,
} from "@features/board";
import { useBoardTranslation } from "@features/board/use-board-translation";
import { PageTitle } from "@app/layouts/page-title";
import { useLoaderData, useParams } from "react-router";

export const Component = function BoardPage() {
  const board = useLoaderData<Board>();
  const { setId } = useParams<BoardRouteParams>();
  const { translatedBoard } = useBoardTranslation({ setId: setId!, board });
  const displayBoard = translatedBoard ?? board;

  return (
    <>
      <PageTitle>{displayBoard.name}</PageTitle>
      <BoardViewer board={displayBoard} />
    </>
  );
};
