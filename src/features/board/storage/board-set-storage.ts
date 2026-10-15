import type { OBFBoard } from "@shayc/open-board-format";
import { normalizeLocale } from "@shared/language/locale";
import { htmlToText } from "./html-to-text";
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

export interface AssetInput {
  readonly path: string;
  readonly blob: Blob;
}

export interface BoardSetCreateInput {
  readonly id: string;
  readonly rootBoardId: string;
  readonly name?: string;
  readonly boards: readonly OBFBoard[];
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

// Arrays sort after strings in IDB, so [setId, []] is an upper bound
// for this set's board IDs and asset paths.
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
  const { id, boards, assets } = input;
  const rootBoard = validateBoardSetInput(input);
  const record = buildBoardSetRecord(input, rootBoard);

  const db = await getBoardsDB();
  const tx = db.transaction(["boardSets", "boards", "assets"], "readwrite");
  const boardSetStore = tx.objectStore("boardSets");
  const boardStore = tx.objectStore("boards");
  const assetStore = tx.objectStore("assets");

  const existing = await boardSetStore.get(id);
  if (existing) {
    await tx.done;
    throw new BoardSetAlreadyExistsError(id);
  }

  // idb creates tx.done eagerly when the transaction is opened, and requests
  // already issued before a synchronous put() failure (e.g. a non-cloneable
  // value) keep running — both must be drained after abort, or they reject
  // as unhandled rejections once the transaction tears down.
  const requests: Promise<unknown>[] = [tx.done];

  try {
    for (const obf of boards) {
      requests.push(
        boardStore.put({
          setId: id,
          id: obf.id,
          name: obf.name ?? obf.id,
          obf,
        }),
      );
    }

    for (const asset of assets) {
      requests.push(
        assetStore.put({
          setId: id,
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

function validateBoardSetInput({
  id,
  rootBoardId,
  boards,
}: BoardSetCreateInput): OBFBoard {
  validateId(id, "setId");
  validateId(rootBoardId, "rootBoardId");

  const boardIds = new Set<string>();
  for (const obf of boards) {
    validateId(obf.id, "boardId");
    if (boardIds.has(obf.id)) {
      throw new Error(`Duplicate board ID: ${obf.id}`);
    }

    boardIds.add(obf.id);
  }

  const rootBoard = boards.find((obf) => obf.id === rootBoardId);
  if (!rootBoard) {
    throw new Error(`Root board not found: ${rootBoardId}`);
  }

  return rootBoard;
}

function buildBoardSetRecord(
  { id, rootBoardId, name, boards }: BoardSetCreateInput,
  rootBoard: OBFBoard,
): BoardSetRecord {
  return {
    id,
    name: name ?? rootBoard.name ?? id,
    rootBoardId,
    updatedAt: Date.now(),
    boardCount: boards.length,
    author: rootBoard.license?.author_name,
    description: rootBoard.description_html
      ? htmlToText(rootBoard.description_html)
      : undefined,
    license: rootBoard.license?.type,
    locale: rootBoard.locale ? normalizeLocale(rootBoard.locale) : undefined,
    gridRows: rootBoard.grid.rows,
    gridColumns: rootBoard.grid.columns,
  };
}
