import type { BoardSetRecord } from "@features/board/db/boards-db";
import { listBoardSets, openBoardsDB } from "@features/board/db/boards-db";
import { useEffect, useState } from "react";

export function useBoardSets() {
  const [boardSets, setBoardSets] = useState<BoardSetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBoardsets() {
      const db = await openBoardsDB();

      try {
        const sets = await listBoardSets(db);
        setBoardSets(sets);
      } finally {
        db.close();
        setIsLoading(false);
      }
    }

    void loadBoardsets();
  }, []);

  return { boardSets, isLoading };
}
