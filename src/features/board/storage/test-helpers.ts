import { invalidateBoardSets } from "./board-sets-store";
import {
  openBoardsDB,
  upsertBoardSet,
  type BoardSetRecord,
  type BoardsDB,
} from "./db";

const STORE_NAMES = ["boardSets", "boards", "assets"] as const;

async function clearAllStores(db: BoardsDB): Promise<void> {
  const tx = db.transaction(STORE_NAMES, "readwrite");
  for (const name of STORE_NAMES) {
    await tx.objectStore(name).clear();
  }
  await tx.done;
}

export async function resetBoardsDB(): Promise<void> {
  const db = await openBoardsDB();
  try {
    await clearAllStores(db);
  } finally {
    db.close();
  }
}

export async function openCleanBoardsDB(): Promise<BoardsDB> {
  const db = await openBoardsDB();
  await clearAllStores(db);
  return db;
}

export interface SeedBoardSet extends Partial<BoardSetRecord> {
  setId: string;
}

export async function seedBoardSets(records: SeedBoardSet[]): Promise<void> {
  const db = await openCleanBoardsDB();
  try {
    for (const record of records) {
      await upsertBoardSet(db, { name: record.setId, ...record });
    }
  } finally {
    db.close();
  }
  await invalidateBoardSets();
}
