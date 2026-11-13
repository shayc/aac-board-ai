import { deleteDB, openDB } from "idb";
import { refreshBoardSets } from "../board-sets/board-sets-store";
import {
  type BoardSetInput,
  insertBoardSet,
} from "../storage/board-set-storage";
import {
  boardSetRange,
  closeBoardsDB,
  getBoardsDB,
} from "../storage/boards-db";
import { makeOBFBoard } from "./fixtures";

const STORE_NAMES = ["boardSets", "boards", "assets"] as const;

interface SeedBoardSet extends Partial<BoardSetInput> {
  id: string;
  rootBoardId: string;
}

export async function resetBoardsDB(): Promise<void> {
  await clearBoardsDB();
  await refreshBoardSets();
}

async function clearBoardsDB(): Promise<void> {
  const db = await getBoardsDB();
  const tx = db.transaction(STORE_NAMES, "readwrite");

  for (const name of STORE_NAMES) {
    await tx.objectStore(name).clear();
  }

  await tx.done;
}

export async function makeBoardsDBUnreadable(): Promise<() => Promise<void>> {
  const { name, version } = await getBoardsDB();
  await closeBoardsDB();
  (await openDB(name, version + 1)).close();

  return () => deleteDB(name);
}

export async function countStoredBoardContent(boardSetId: string): Promise<{
  boardCount: number;
  assetCount: number;
}> {
  const db = await getBoardsDB();
  const tx = db.transaction(["boards", "assets"], "readonly");
  const keyRange = boardSetRange(boardSetId);
  const [boardCount, assetCount] = await Promise.all([
    tx.objectStore("boards").count(keyRange),
    tx.objectStore("assets").count(keyRange),
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
