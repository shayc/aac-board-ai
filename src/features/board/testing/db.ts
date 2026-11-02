import type { OBFBoard } from "@shayc/open-board-format";
import { refreshBoardSets } from "../board-sets/board-sets-store";
import {
  createBoardSet,
  type BoardSetInput,
} from "../storage/board-set-storage";
import { getBoardsDB } from "../storage/boards-db";

const STORE_NAMES = ["boardSets", "boards", "assets"] as const;

interface SeedBoardSet extends Partial<BoardSetInput> {
  id: string;
  rootBoardId: string;
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

export function makeBoardSetInput(
  overrides: Partial<BoardSetInput> = {},
): BoardSetInput {
  const boards = overrides.boards ?? [makeOBFBoard({ id: "root-1" })];

  return {
    id: "set-1",
    name: "Set",
    rootBoardId: boards[0]?.id ?? "root-1",
    boards,
    assets: [],
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
  await resetBoardsDB();
  for (const { boards, assets = [], ...record } of records) {
    await createBoardSet({
      name: record.id,
      ...record,
      boards: boards ?? [makeOBFBoard({ id: record.rootBoardId })],
      assets,
    });
  }

  await refreshBoardSets();
}
