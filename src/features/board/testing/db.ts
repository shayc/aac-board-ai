import type { OBFBoard } from "@shayc/open-board-format";
import { refreshBoardSets } from "../board-sets/board-sets-store";
import type { BoardRecord } from "../storage/board-content-storage";
import {
  createBoardSet,
  type AssetInput,
  type BoardSetRecord,
} from "../storage/board-set-storage";
import { getBoardsDB } from "../storage/boards-db";

const STORE_NAMES = ["boardSets", "boards", "assets"] as const;

interface SeedBoardSet extends Partial<BoardSetRecord> {
  setId: string;
  rootBoardId: string;
  boards?: Omit<BoardRecord, "setId">[];
  assets?: AssetInput[];
}

export function makeOBFBoard(overrides: Partial<OBFBoard> = {}): OBFBoard {
  return {
    format: "open-board-0.1",
    id: "board-1",
    locale: "en",
    name: "Test Board",
    buttons: [],
    grid: { rows: 1, columns: 1, order: [[null]] },
    images: [],
    sounds: [],
    ...overrides,
  };
}

async function clearBoardsDB(): Promise<void> {
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

export async function countStoredBoardContent(setId: string): Promise<{
  boards: number;
  assets: number;
}> {
  const db = await getBoardsDB();
  const tx = db.transaction(["boards", "assets"], "readonly");
  const boardCount = tx.objectStore("boards").index("bySetId").count(setId);
  const assetCount = tx.objectStore("assets").index("bySetId").count(setId);
  const [boards, assets] = await Promise.all([boardCount, assetCount, tx.done]);

  return { boards, assets };
}

export async function seedBoardSets(records: SeedBoardSet[]): Promise<void> {
  await clearBoardsDB();
  for (const { boards = [], assets = [], ...record } of records) {
    await createBoardSet({
      boardSet: { name: record.setId, ...record },
      boards,
      assets,
    });
  }

  await refreshBoardSets();
}
