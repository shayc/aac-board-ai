import type { OBFBoard } from "@shayc/open-board-format";
import { refreshBoardSets } from "../board-sets/board-sets-store";
import {
  getBoardsDB,
  replaceBoardSet,
  type AssetInput,
  type BoardRecord,
  type BoardSetRecord,
} from "../storage/boards-db";

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

export async function seedBoardSets(records: SeedBoardSet[]): Promise<void> {
  await clearBoardsDB();
  for (const { boards = [], assets = [], ...record } of records) {
    await replaceBoardSet({
      boardSet: { name: record.setId, ...record },
      boards,
      assets,
    });
  }

  await refreshBoardSets();
}
