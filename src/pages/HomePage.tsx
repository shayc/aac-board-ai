import { openBoardsDB } from "@/features/board/db/boards-db";
import { importFile } from "@/features/board/db/import-board";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultBoardIfNeeded() {
      const db = await openBoardsDB();
      const existingSets = await db.getAll("boardsets");
      db.close();

      if (existingSets.length > 0) return;

      const obzUrl = `${import.meta.env.BASE_URL}quick-core-24.obz`;
      const response = await fetch(obzUrl, { cache: "no-store" });
      const blob = await response.blob();
      const file = new File([blob], "quick-core-24.obz", {
        type: blob.type || "application/octet-stream",
      });

      const { setId, boardId } = await importFile(file);
      if (cancelled) return;

      navigate(
        `/sets/${encodeURIComponent(setId)}/boards/${encodeURIComponent(
          boardId
        )}`,
        { replace: true }
      );
    }

    loadDefaultBoardIfNeeded().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        marginTop: 4,
      }}
    >
      <CircularProgress />
      <Typography>Loading board...</Typography>
    </Box>
  );
}
