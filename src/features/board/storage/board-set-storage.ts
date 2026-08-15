import type { OBFBoard } from "@shayc/open-board-format";
import {
  getBoardsDB,
  normalizeAssetPath,
  validateId,
  type BoardSetRecord,
} from "./boards-db";

export type { BoardSetRecord } from "./boards-db";
export { InvalidIdError } from "./boards-db";

export class BoardSetAlreadyExistsError extends Error {
  constructor(setId: string) {
    super(`Board set already exists: ${setId}`);
    this.name = "BoardSetAlreadyExistsError";
  }
}

export interface BoardSetInput {
  readonly setId: string;
  readonly name: string;
  readonly rootBoardId: string;
  readonly author?: string;
  readonly description?: string;
  readonly license?: string;
  readonly locale?: string;
  readonly gridRows?: number;
  readonly gridColumns?: number;
}

export interface BoardInput {
  readonly boardId: string;
  readonly name: string;
  readonly obf: OBFBoard;
}

export interface AssetInput {
  readonly path: string;
  readonly blob: Blob;
}

export interface BoardSetCreateInput {
  readonly boardSet: BoardSetInput;
  readonly boards: readonly BoardInput[];
  readonly assets: readonly AssetInput[];
}

export async function getBoardSet(
  setId: string,
): Promise<BoardSetRecord | undefined> {
  validateId(setId, "setId");
  const db = await getBoardsDB();

  return db.get("boardSets", setId);
}

export async function listBoardSets(): Promise<BoardSetRecord[]> {
  const db = await getBoardsDB();
  const boardSets = await db.getAllFromIndex("boardSets", "byUpdatedAt");

  return boardSets.reverse();
}

// The [] upper bound exploits IDB key ordering — arrays sort after strings,
// so [setId, []] is the smallest key greater than every [setId, "..."].
function boardSetRange(setId: string): IDBKeyRange {
  return IDBKeyRange.bound([setId], [setId, []]);
}

export async function deleteBoardSet(setId: string): Promise<void> {
  validateId(setId, "setId");
  const db = await getBoardsDB();
  const tx = db.transaction(["boards", "assets", "boardSets"], "readwrite");
  const setRange = boardSetRange(setId);

  await Promise.all([
    tx.objectStore("boards").delete(setRange),
    tx.objectStore("assets").delete(setRange),
    tx.objectStore("boardSets").delete(setId),
    tx.done,
  ]);
}

export async function createBoardSet(
  input: BoardSetCreateInput,
): Promise<void> {
  const { boardSet, boards, assets } = input;
  validateId(boardSet.setId, "setId");
  validateId(boardSet.rootBoardId, "rootBoardId");
  for (const board of boards) {
    validateId(board.boardId, "boardId");
  }

  const { setId } = boardSet;
  const db = await getBoardsDB();
  const tx = db.transaction(["boardSets", "boards", "assets"], "readwrite");
  const boardSetStore = tx.objectStore("boardSets");
  const boardStore = tx.objectStore("boards");
  const assetStore = tx.objectStore("assets");

  const existing = await boardSetStore.get(setId);
  if (existing) {
    await tx.done;
    throw new BoardSetAlreadyExistsError(setId);
  }

  const record: BoardSetRecord = {
    setId,
    name: boardSet.name,
    rootBoardId: boardSet.rootBoardId,
    updatedAt: Date.now(),
    boardCount: boards.length,
    author: boardSet.author,
    description: boardSet.description,
    license: boardSet.license,
    locale: boardSet.locale,
    gridRows: boardSet.gridRows,
    gridColumns: boardSet.gridColumns,
  };

  // idb creates tx.done eagerly when the transaction is opened, and requests
  // already issued before a synchronous put() failure (e.g. a non-cloneable
  // value) keep running — both must be drained after abort, or they reject
  // as unhandled rejections once the transaction tears down.
  const requests: Promise<unknown>[] = [tx.done];

  try {
    for (const board of boards) {
      requests.push(
        boardStore.put({
          setId,
          boardId: board.boardId,
          name: board.name,
          obf: board.obf,
        }),
      );
    }

    for (const asset of assets) {
      requests.push(
        assetStore.put({
          setId,
          path: normalizeAssetPath(asset.path),
          blob: asset.blob,
        }),
      );
    }

    requests.push(boardSetStore.add(record));

    await Promise.all(requests);
  } catch (error) {
    try {
      tx.abort();
    } catch {
      // Already finished — the transaction aborted itself.
    }

    await Promise.allSettled(requests);
    throw error;
  }
}
