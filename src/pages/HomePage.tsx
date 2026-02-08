import {
  fetchBoardSets,
  importBoardFiles,
} from "@features/board/store/board-sets-store";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { useEffect } from "react";
import { generatePath, useNavigate } from "react-router";

export function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultBoardIfNeeded() {
      const existingSets = await fetchBoardSets();

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
        generatePath("/sets/:setId/boards/:boardId", { setId, boardId }),
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
