import type { OBFBoard } from "@shayc/open-board-format";
import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";

export interface BoardSetRecord {
  setId: string;
  name: string;
  rootBoardId: string;
  updatedAt: number;
  boardCount: number;
  author?: string;
  description?: string;
  license?: string;
  locale?: string;
  gridRows?: number;
  gridColumns?: number;
}

export interface BoardRecord {
  setId: string;
  boardId: string;
  name: string;
  obf: OBFBoard;
}

export interface AssetRecord {
  setId: string;
  path: string;
  blob: Blob;
}

export class BoardNotFoundError extends Error {
  constructor(setId: string, boardId: string) {
    super(`Board not found: ${setId}/${boardId}`);
    this.name = "BoardNotFoundError";
  }
}

const MAX_ID_LENGTH = 255;

export class InvalidIdError extends Error {
  constructor(fieldName: string) {
    super(`Invalid ${fieldName}: must be 1-${MAX_ID_LENGTH} characters`);
    this.name = "InvalidIdError";
  }
}

export interface UpsertBoardSetInput {
  setId: string;
  name: string;
  rootBoardId: string;
  author?: string;
  description?: string;
  license?: string;
  locale?: string;
  gridRows?: number;
  gridColumns?: number;
}

export interface UpsertBoardInput {
  boardId: string;
  name: string;
  obf: OBFBoard;
}

export interface UpsertAssetInput {
  path: string;
  blob: Blob;
}

interface BoardsDBSchema extends DBSchema {
  boardSets: {
    key: string;
    value: BoardSetRecord;
    indexes: { byUpdatedAt: number };
  };
  boards: {
    key: [string, string];
    value: BoardRecord;
    indexes: { bySetId: string };
  };
  assets: {
    key: [string, string];
    value: AssetRecord;
    indexes: { bySetId: string };
  };
}

export type BoardsDB = IDBPDatabase<BoardsDBSchema>;

const DB_NAME = "aac-boards-db";
const DB_VERSION = 1;

function normalizePath(rawPath: string): string {
  if (!rawPath) {
    throw new Error("Path cannot be empty");
  }

  const normalized = rawPath
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/");

  return normalized;
}

function validateId(id: string, fieldName: string): void {
  if (!id || id.length > MAX_ID_LENGTH) {
    throw new InvalidIdError(fieldName);
  }
}

let connection: Promise<BoardsDB> | null = null;

export function getBoardsDB(): Promise<BoardsDB> {
  connection ??= openConnection().catch((error: unknown) => {
    connection = null;
    throw error;
  });

  return connection;
}

export async function closeBoardsDB(): Promise<void> {
  const pending = connection;
  connection = null;
  try {
    (await pending)?.close();
  } catch {
    // Open never succeeded — nothing to close.
  }
}

function openConnection(): Promise<BoardsDB> {
  return openDB<BoardsDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const boardSets = db.createObjectStore("boardSets", {
          keyPath: "setId",
        });
        boardSets.createIndex("byUpdatedAt", "updatedAt");

        const boards = db.createObjectStore("boards", {
          keyPath: ["setId", "boardId"],
        });
        boards.createIndex("bySetId", "setId");

        const assets = db.createObjectStore("assets", {
          keyPath: ["setId", "path"],
        });
        assets.createIndex("bySetId", "setId");
      }
    },
    blocked(currentVersion, blockedVersion) {
      console.warn(
        `boards-db upgrade to v${blockedVersion} blocked by a tab holding v${currentVersion}`,
      );
    },
    blocking() {
      void closeBoardsDB();
    },
    terminated() {
      connection = null;
    },
  });
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

export async function deleteBoardSetData(setId: string): Promise<void> {
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

export interface ReplaceBoardSetInput {
  boardSet: UpsertBoardSetInput;
  boards: UpsertBoardInput[];
  assets: UpsertAssetInput[];
}

export async function replaceBoardSet(
  input: ReplaceBoardSetInput,
): Promise<{ replacedExisting: boolean }> {
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
  const setRange = boardSetRange(setId);

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
    requests.push(boardStore.delete(setRange), assetStore.delete(setRange));
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
          path: normalizePath(asset.path),
          blob: asset.blob,
        }),
      );
    }
    requests.push(boardSetStore.put(record));

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

  return { replacedExisting: existing !== undefined };
}

export async function getBoard(
  setId: string,
  boardId: string,
): Promise<BoardRecord | undefined> {
  validateId(setId, "setId");
  validateId(boardId, "boardId");
  const db = await getBoardsDB();

  return db.get("boards", [setId, boardId]);
}

export async function listBoards(setId: string): Promise<BoardRecord[]> {
  validateId(setId, "setId");
  const db = await getBoardsDB();

  return db.getAllFromIndex("boards", "bySetId", setId);
}

export async function updateBoardStrings(
  setId: string,
  boardId: string,
  language: string,
  translations: Record<string, string>,
): Promise<void> {
  validateId(setId, "setId");
  validateId(boardId, "boardId");
  const db = await getBoardsDB();
  const tx = db.transaction("boards", "readwrite");
  const record = await tx.store.get([setId, boardId]);

  if (!record) {
    throw new BoardNotFoundError(setId, boardId);
  }

  const updatedObf = {
    ...record.obf,
    strings: { ...record.obf.strings, [language]: translations },
  };

  await tx.store.put({ ...record, obf: updatedObf });
  await tx.done;
}

export async function getAssetBlob(
  setId: string,
  path: string,
): Promise<Blob | undefined> {
  validateId(setId, "setId");
  const db = await getBoardsDB();
  const cleanPath = normalizePath(path);
  const asset = await db.get("assets", [setId, cleanPath]);

  return asset?.blob;
}
