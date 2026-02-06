import { useBoardSets } from "@features/board/hooks/useBoardSets";
import { ErrorFallback } from "@shared/components/ErrorFallback";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { Navigate, useParams } from "react-router";

export function BoardSetRootRedirect() {
  const { setId } = useParams();
  const { boardSets, isLoading } = useBoardSets();

  if (!setId) {
    return <ErrorFallback title="Error" message="Board set ID is required" />;
  }

  if (isLoading) {
    return <LoadingIndicator message="Loading board set..." />;
  }

  const boardSet = boardSets.find((s) => s.setId === setId);

  if (!boardSet) {
    return (
      <ErrorFallback title="Error" message={`Board set "${setId}" not found`} />
    );
  }

  if (!boardSet.rootBoardId) {
    return (
      <ErrorFallback
        title="Error"
        message={`Board set "${setId}" has no root board`}
      />
    );
  }

  return (
    <Navigate to={`/sets/${setId}/boards/${boardSet.rootBoardId}`} replace />
  );
}
