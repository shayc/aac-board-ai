import {
  listBoardSets,
  openBoardsDB,
  type BoardSetRecord,
} from "@features/board/db/boards-db";
import { useEffect, useState } from "react";

export interface UseBoardSetsReturn {
  boardSets: BoardSetRecord[];
  isLoading: boolean;
}

export function useBoardSets(): UseBoardSetsReturn {
  const [boardSets, setBoardSets] = useState<BoardSetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadBoardSets() {
      setIsLoading(true);
      const db = await openBoardsDB();

      try {
        const sets = await listBoardSets(db);
        if (!cancelled) {
          setBoardSets(sets);
        }
      } finally {
        db.close();
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadBoardSets();

    return () => {
      cancelled = true;
    };
  }, []);

  return { boardSets, isLoading };
}
