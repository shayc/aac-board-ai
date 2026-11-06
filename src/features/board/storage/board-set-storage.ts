import type { OBFBoard } from "@shayc/open-board-format";
import { normalizeLocale } from "@shared/language/locale";
import { nonBlankText } from "../non-blank-text";
import { htmlToText } from "./html-to-text";
import {
  getBoardsDB,
  normalizeAssetPath,
  validateId,
  type BoardSetRecord,
} from "./boards-db";

export { MAX_ID_LENGTH } from "./boards-db";
export type { BoardSetRecord } from "./boards-db";

export class BoardSetAlreadyExistsError extends Error {
  constructor(boardSetId: string) {
    super(`Board set already exists: ${boardSetId}`);
    this.name = "BoardSetAlreadyExistsError";
  }
}

export interface AssetInput {
  readonly path: string;
  readonly blob: Blob;
}

export interface BoardSetInput {
  readonly id: string;
  readonly rootBoardId: string;
  readonly name?: string;
  readonly boards: readonly OBFBoard[];
  readonly assets: readonly AssetInput[];
}

export async function getBoardSetRecord(
  boardSetId: string,
): Promise<BoardSetRecord | undefined> {
  const db = await getBoardsDB();

  return db.get("boardSets", boardSetId);
}

export async function listBoardSetRecords(): Promise<BoardSetRecord[]> {
  const db = await getBoardsDB();
  const boardSets = await db.getAllFromIndex("boardSets", "byUpdatedAt");

  return boardSets.reverse();
}

// Arrays sort after strings in IDB, so [boardSetId, []] is an upper bound
// for this set's board IDs and asset paths.
function boardSetRange(boardSetId: string): IDBKeyRange {
  return IDBKeyRange.bound([boardSetId], [boardSetId, []]);
}

export async function deleteBoardSetRecords(boardSetId: string): Promise<void> {
  validateId(boardSetId, "boardSetId");
  const db = await getBoardsDB();
  const tx = db.transaction(["boards", "assets", "boardSets"], "readwrite");
  const keyRange = boardSetRange(boardSetId);

  await Promise.all([
    tx.objectStore("boards").delete(keyRange),
    tx.objectStore("assets").delete(keyRange),
    tx.objectStore("boardSets").delete(boardSetId),
    tx.done,
  ]);
}

export async function createBoardSetRecords(
  input: BoardSetInput,
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
          boardSetId: id,
          id: obf.id,
          name: nonBlankText(obf.name) ?? obf.id,
          obf,
        }),
      );
    }

    for (const asset of assets) {
      requests.push(
        assetStore.put({
          boardSetId: id,
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
}: BoardSetInput): OBFBoard {
  validateId(id, "boardSetId");
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
  { id, rootBoardId, name, boards }: BoardSetInput,
  rootBoard: OBFBoard,
): BoardSetRecord {
  return {
    id,
    name: nonBlankText(name) ?? nonBlankText(rootBoard.name) ?? id,
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
