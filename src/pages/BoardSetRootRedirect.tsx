import { type BoardRouteParams, useBoardSets } from "@features/board";
import { ErrorState } from "@shared/components/ErrorState";
import { LoadingState } from "@shared/components/LoadingState";
import { generatePath, Navigate, useParams } from "react-router";

export function BoardSetRootRedirect() {
  const { setId } = useParams<BoardRouteParams>();
  const { boardSets, isLoading } = useBoardSets();

  if (!setId) {
    return (
      <ErrorState
        title="Missing board set ID"
        description="The URL is missing a board set ID."
      />
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading board set..." />;
  }

  const boardSet = boardSets.find((s) => s.setId === setId);

  if (!boardSet) {
    return (
      <ErrorState
        title="Board set not found"
        description={`No board set with id "${setId}".`}
      />
    );
  }

  if (!boardSet.rootBoardId) {
    return (
      <ErrorState
        title="Board set has no root board"
        description={`The board set "${setId}" is missing a root board.`}
      />
    );
  }

  return (
    <Navigate
      to={generatePath("/sets/:setId/boards/:boardId", {
        setId,
        boardId: boardSet.rootBoardId,
      })}
      replace
    />
  );
}
