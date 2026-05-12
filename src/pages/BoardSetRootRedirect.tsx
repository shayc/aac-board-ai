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
        description="We couldn't find this board set. It may have been deleted."
      />
    );
  }

  if (!boardSet.rootBoardId) {
    return (
      <ErrorState
        title="Board set is incomplete"
        description="This board set is missing a starting board."
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
