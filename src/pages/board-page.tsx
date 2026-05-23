import {
  BoardViewer,
  type Board,
  type BoardRouteParams,
} from "@features/board";
import { useBoardTranslation } from "@features/board/use-board-translation";
import { PageTitle } from "@app/layouts/page-title";
import { LoadingState } from "@shared/components/loading-state";
import { m } from "@paraglide/messages.js";
import { useLoaderData, useParams } from "react-router";

export const Component = function BoardPage() {
  const board = useLoaderData<Board>();
  const { setId } = useParams<BoardRouteParams>();
  const { translatedBoard } = useBoardTranslation({ setId: setId!, board });

  return (
    <>
      <PageTitle>{translatedBoard?.name ?? board.name}</PageTitle>
      {translatedBoard ? (
        <BoardViewer board={translatedBoard} />
      ) : (
        <LoadingState message={m.boardLoading()} />
      )}
    </>
  );
};
