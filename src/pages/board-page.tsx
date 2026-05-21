import { Title } from "@app/title";
import { useDeclareAppHeaderTitle } from "@app/layouts/app-header-title";
import { BoardViewer, type BoardLoaderData } from "@features/board";
import { useBoardTranslation } from "@features/board/use-board-translation";
import { LoadingState } from "@shared/components/loading-state";
import { useLoaderData } from "react-router";

export const Component = function BoardPage() {
  const { setId, board } = useLoaderData<BoardLoaderData>();
  const { translatedBoard } = useBoardTranslation({ setId, board });

  // Hooks must run unconditionally — keep the title declaration above the
  // early return. The untranslated name carries the header until translation
  // settles, so it never flickers blank.
  useDeclareAppHeaderTitle(translatedBoard?.name ?? board.name);

  if (!translatedBoard) {
    return <LoadingState message="Loading board..." />;
  }

  return (
    <>
      <Title>{translatedBoard.name}</Title>
      <BoardViewer board={translatedBoard} />
    </>
  );
};
