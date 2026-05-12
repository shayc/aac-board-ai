import { type BoardRouteParams, useBoardSets } from "@features/board";
import { ErrorState } from "@shared/components/ErrorState";
import { LoadingState } from "@shared/components/LoadingState";
import { generatePath, Navigate, useParams } from "react-router";

export function BoardSetRootRedirect() {
  const { setId } = useParams<BoardRouteParams>();
  const { boardSets, isLoading } = useBoardSets();

  if (!setId) {
    return <ErrorState title="Error" description="Board set ID is required" />;
  }

  if (isLoading) {
    return <LoadingState message="Loading board set..." />;
  }

  const boardSet = boardSets.find((s) => s.setId === setId);

  if (!boardSet) {
    return (
      <ErrorState
        title="Error"
        description={`Board set "${setId}" not found`}
      />
    );
  }

  if (!boardSet.rootBoardId) {
    return (
      <ErrorState
        title="Error"
        description={`Board set "${setId}" has no root board`}
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
