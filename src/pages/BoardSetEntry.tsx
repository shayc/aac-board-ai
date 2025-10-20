import { getBoardset, openBoardsDB } from "@features/board/db/boards-db";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";

export function BoardSetEntry() {
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
          const boardset = await getBoardset(db, setId!);

          if (!boardset) {
            setError(`Board set "${setId}" not found`);
            return;
          }

          if (!boardset.rootBoardId) {
            setError(`Board set "${setId}" has no root board`);
            return;
          }

          setRootBoardId(boardset.rootBoardId);
        } finally {
          db.close();
        }
      } catch (err) {
        console.error("Error fetching root board:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load board set"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchRootBoard();
  }, [setId]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        Loading board set...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (rootBoardId && setId) {
    return <Navigate to={`/sets/${setId}/boards/${rootBoardId}`} replace />;
  }

  return null;
}
