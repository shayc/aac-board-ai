import { Board } from "@features/board/components/Board/Board";
import { BoardNavigation } from "@features/board/components/BoardNavigation";
import { BoardSetSelector } from "@features/board/components/BoardSetSelector/BoardSetSelector";
import { useBoardSets } from "@features/board/hooks/useBoardSets";
import type { BoardRouteParams } from "@shared/types/routes";
import { useEffect } from "react";
import { useOutletContext, useParams } from "react-router";

interface OutletContext {
  setHeaderContent: (content: React.ReactNode) => void;
}

export function BoardPage() {
  const { setHeaderContent } = useOutletContext<OutletContext>();
  const { setId = "" } = useParams<BoardRouteParams>();
  const { boardSets } = useBoardSets();

  useEffect(() => {
    if (boardSets.length > 0) {
      setHeaderContent(
        <>
          <BoardNavigation />
          <BoardSetSelector boardSets={boardSets} setId={setId} />
        </>,
      );
    }

    return () => setHeaderContent(null);
  }, [boardSets, setId, setHeaderContent]);

  return <Board />;
}
