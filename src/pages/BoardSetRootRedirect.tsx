import { getBoardset, openBoardsDB } from "@features/board/db/boards-db";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { BoardRouteParams } from "@shared/types/routes";
import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";

export function BoardSetRootRedirect() {
  const { setId } = useParams<BoardRouteParams>();
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
          err instanceof Error ? err.message : "Failed to load board set",
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchRootBoard();
  }, [setId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        Loading board set...
      </Box>
    );
  }

  if (error) {
    return (
      <Stack
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
        gap={2}
      >
        <Typography variant="h5">Error</Typography>
        <Typography>{error}</Typography>
      </Stack>
    );
  }

  if (rootBoardId && setId) {
    return <Navigate to={`/sets/${setId}/boards/${rootBoardId}`} replace />;
  }

  return null;
}
