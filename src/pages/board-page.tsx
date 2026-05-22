import { useDeclareAppHeaderTitle } from "@app/layouts/app-header-title";
import {
  BoardViewer,
  type Board,
  type BoardRouteParams,
} from "@features/board";
import { useBoardTranslation } from "@features/board/use-board-translation";
import { LoadingState } from "@shared/components/loading-state";
import { m } from "@paraglide/messages.js";
import { Title } from "@shared/components/title";
import { useLoaderData, useParams } from "react-router";

export const Component = function BoardPage() {
  const board = useLoaderData<Board>();
  const { setId } = useParams<BoardRouteParams>();
  const { translatedBoard } = useBoardTranslation({ setId: setId!, board });

  useDeclareAppHeaderTitle(translatedBoard?.name ?? board.name);

  if (!translatedBoard) {
    return <LoadingState message={m.boardLoading()} />;
  }

  return (
    <>
      <Title>{translatedBoard.name}</Title>
      <BoardViewer board={translatedBoard} />
    </>
  );
};
