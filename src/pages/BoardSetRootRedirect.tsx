import { type BoardRouteParams, useBoardSets } from "@features/board";
import { ErrorState } from "@shared/components/ErrorState";
import { LoadingState } from "@shared/components/LoadingState";
import { generatePath, Navigate, useParams } from "react-router";

export function BoardSetRootRedirect() {
  const { setId = "" } = useParams<BoardRouteParams>();
  const { boardSets, isLoading } = useBoardSets();

  if (isLoading) {
    return <LoadingState message="Loading board set..." />;
  }

  const boardSet = boardSets.find((s) => s.setId === setId);

  if (!boardSet) {
    return (
      <ErrorState
        title="Board set not found"
        description="This board set may have been deleted."
      />
    );
  }

  if (!boardSet.rootBoardId) {
    return (
      <ErrorState
        title="Board set incomplete"
        description="This board set has no starting board."
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
