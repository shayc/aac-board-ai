import { Board } from "@features/board/components/Board/Board";
import { BoardNavigation } from "@features/board/components/BoardNavigation";
import { BoardSetSelector } from "@features/board/components/BoardSetSelector/BoardSetSelector";
import { useBoardsets } from "@features/board/hooks/useBoardsets";
import type { BoardRouteParams } from "@shared/types/routes";
import { useEffect } from "react";
import { useOutletContext, useParams } from "react-router";

interface OutletContext {
  setHeaderContent: (content: React.ReactNode) => void;
}

export function BoardPage() {
  const { setHeaderContent } = useOutletContext<OutletContext>();
  const { setId = "" } = useParams<BoardRouteParams>();
  const { boardsets } = useBoardsets();

  useEffect(() => {
    if (boardsets.length > 0) {
      setHeaderContent(
        <>
          <BoardNavigation />
          <BoardSetSelector boardsets={boardsets} setId={setId} />
        </>,
      );
    }

    return () => setHeaderContent(null);
  }, [boardsets, setId, setHeaderContent]);

  return <Board />;
}
