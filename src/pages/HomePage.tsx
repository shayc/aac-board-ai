import { openBoardsDB } from "@features/board/db/boards-db";
import { importBoardFiles } from "@features/board/store/board-sets-store";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
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

      if (existingSets.length > 0) {
        void navigate(`/sets/${encodeURIComponent(existingSets[0].setId)}`);
        return;
      }

      const obzUrl = `${import.meta.env.BASE_URL}quick-core-24.obz`;
      const response = await fetch(obzUrl, { cache: "no-store" });
      const blob = await response.blob();
      const file = new File([blob], "quick-core-24.obz", {
        type: blob.type ?? "application/octet-stream",
      });

      const [{ setId, boardId }] = await importBoardFiles(file);
      if (cancelled) {
        return;
      }

      void navigate(
        `/sets/${encodeURIComponent(setId)}/boards/${encodeURIComponent(
          boardId,
        )}`,
        { replace: true },
      );
    }

    loadDefaultBoardIfNeeded().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return <LoadingIndicator message="Loading board..." />;
}
