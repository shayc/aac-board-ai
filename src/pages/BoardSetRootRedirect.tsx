import { getBoardSet, openBoardsDB } from "@features/board/db/boards-db";
import { ErrorFallback } from "@shared/components/ErrorFallback";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";

export function BoardSetRootRedirect() {
  const { setId } = useParams();
  const [rootBoardId, setRootBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!setId) {
      setError("Board set ID is required");
      setLoading(false);
      return;
    }

    async function fetchRootBoard() {
      try {
        const db = await openBoardsDB();
        try {
          const boardSet = await getBoardSet(db, setId!);

          if (!boardSet) {
            setError(`Board set "${setId}" not found`);
            return;
          }

          if (!boardSet.rootBoardId) {
            setError(`Board set "${setId}" has no root board`);
            return;
          }

          setRootBoardId(boardSet.rootBoardId);
        } finally {
          db.close();
        }
      } catch (err) {
        console.error("Error fetching root board:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load board set",
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchRootBoard();
  }, [setId]);

  if (loading) {
    return <LoadingIndicator message="Loading board set..." />;
  }

  if (error) {
    return <ErrorFallback title="Error" message={error} />;
  }

  if (rootBoardId && setId) {
    return <Navigate to={`/sets/${setId}/boards/${rootBoardId}`} replace />;
  }

  return null;
}
