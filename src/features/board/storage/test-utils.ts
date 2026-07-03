import { refreshBoardSets } from "../board-sets/board-sets-store";
import { getBoardsDB, replaceBoardSet, type BoardSetRecord } from "./boards-db";

const STORE_NAMES = ["boardSets", "boards", "assets"] as const;

export interface SeedBoardSet extends Partial<BoardSetRecord> {
  setId: string;
  rootBoardId: string;
}

export async function clearBoardsDB(): Promise<void> {
  const db = await getBoardsDB();
  const tx = db.transaction(STORE_NAMES, "readwrite");
  for (const name of STORE_NAMES) {
    await tx.objectStore(name).clear();
  }

  await tx.done;
}

export async function resetBoardsDB(): Promise<void> {
  await clearBoardsDB();
  await refreshBoardSets();
}

export async function seedBoardSets(records: SeedBoardSet[]): Promise<void> {
  await clearBoardsDB();
  for (const record of records) {
    await replaceBoardSet({
      boardSet: { name: record.setId, ...record },
      boards: [],
      assets: [],
    });
  }

  await refreshBoardSets();
}
