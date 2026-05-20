import { getBoardSets, importBoardFromUrl } from "@features/board";
import { ErrorState } from "@shared/components/error-state";
import { LoadingState } from "@shared/components/loading-state";
import { useEffect, useState } from "react";
import { generatePath, useNavigate, useSearchParams } from "react-router";

const DEFAULT_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

async function resolveInitialBoard(boardUrl: string | null): Promise<string> {
  if (boardUrl) {
    const { setId, boardId } = await importBoardFromUrl(boardUrl);
    return generatePath("/sets/:setId/boards/:boardId", { setId, boardId });
  }

  const existingSets = await getBoardSets();
  if (existingSets.length > 0) {
    return generatePath("/sets/:setId", { setId: existingSets[0].setId });
  }

  const { setId, boardId } = await importBoardFromUrl(DEFAULT_BOARD_URL);
  return generatePath("/sets/:setId/boards/:boardId", { setId, boardId });
}

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<unknown>(null);

  const boardUrl = searchParams.get("board");

  useEffect(() => {
    let cancelled = false;

    resolveInitialBoard(boardUrl)
      .then((path) => {
        if (!cancelled) {
          void navigate(path, { replace: true });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, boardUrl]);

  if (error) {
    return (
      <ErrorState
        title="Couldn't load board"
        description="Try importing a board file to get started."
      />
    );
  }

  return <LoadingState message="Loading board..." />;
}
