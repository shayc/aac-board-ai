import { refreshBoardSets } from "../board-sets/board-sets-store";
import {
  insertBoardSet,
  type BoardSetInput,
} from "../storage/board-set-storage";
import { getBoardsDB } from "../storage/boards-db";
import { makeOBFBoard } from "./fixtures";

interface SeedBoardSet extends Partial<BoardSetInput> {
  id: string;
  rootBoardId: string;
}

async function clearBoardsDB(): Promise<void> {
  const db = await getBoardsDB();
  const storeNames = Array.from(db.objectStoreNames);
  const tx = db.transaction(storeNames, "readwrite");
  for (const name of storeNames) {
    await tx.objectStore(name).clear();
  }

  await tx.done;
}

export async function resetBoardsDB(): Promise<void> {
  await clearBoardsDB();
  await refreshBoardSets();
}

export async function countStoredBoardContent(boardSetId: string): Promise<{
  boardCount: number;
  assetCount: number;
}> {
  const db = await getBoardsDB();
  const tx = db.transaction(["boards", "assets"], "readonly");
  const [boardCount, assetCount] = await Promise.all([
    tx.objectStore("boards").index("byBoardSetId").count(boardSetId),
    tx.objectStore("assets").index("byBoardSetId").count(boardSetId),
    tx.done,
  ]);

  return { boardCount, assetCount };
}

export async function seedBoardSets(records: SeedBoardSet[]): Promise<void> {
  for (const { boards, assets = [], ...record } of records) {
    await insertBoardSet({
      name: record.id,
      ...record,
      boards: boards ?? [makeOBFBoard({ id: record.rootBoardId })],
      assets,
    });
  }

  await refreshBoardSets();
}
