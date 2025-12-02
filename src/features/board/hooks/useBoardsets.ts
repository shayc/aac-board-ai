import type { BoardsetRecord } from "@features/board/db/boards-db";
import { listBoardsets, openBoardsDB } from "@features/board/db/boards-db";
import { useEffect, useState } from "react";

export function useBoardsets() {
  const [boardsets, setBoardsets] = useState<BoardsetRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBoardsets() {
      const db = await openBoardsDB();

      try {
        const sets = await listBoardsets(db);
        setBoardsets(sets);
      } finally {
        db.close();
        setIsLoading(false);
      }
    }

    void loadBoardsets();
  }, []);

  return { boardsets, isLoading };
}
