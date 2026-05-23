import { PageTitle } from "@app/layouts/page-title";
import {
  BoardViewer,
  useBoardTranslation,
  type Board,
  type BoardRouteParams,
} from "@features/board";
import { useLoaderData, useParams } from "react-router";

export const Component = function BoardPage() {
  const board = useLoaderData<Board>();
  const { setId } = useParams<BoardRouteParams>();
  const { translatedBoard } = useBoardTranslation({ setId: setId!, board });

  return (
    <>
      <PageTitle>{translatedBoard.name}</PageTitle>
      <BoardViewer board={translatedBoard} />
    </>
  );
};
