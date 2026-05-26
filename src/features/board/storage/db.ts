import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";
import type { OBFBoard } from "open-board-format";

// Stored records

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
  mediaId?: string;
  blob: Blob;
  mime?: string;
  size?: number;
}

// Input shapes

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
  mime?: string;
  size?: number;
  mediaId?: string;
}

// Schema

export interface BoardsDBSchema extends DBSchema {
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
    indexes: { bySetId: string; bySetIdAndMediaId: [string, string] };
  };
}

export type BoardsDB = IDBPDatabase<BoardsDBSchema>;

const DB_NAME = "aac-boards-db";
const DB_VERSION = 1;

// Helpers

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
  if (!id || id.length > 255) {
    throw new Error(`Invalid ${fieldName}: must be 1-255 characters`);
  }
}

// Connection

export async function openBoardsDB(): Promise<BoardsDB> {
  const db = await openDB<BoardsDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const boardSets = db.createObjectStore("boardSets", { keyPath: "setId" });
      boardSets.createIndex("byUpdatedAt", "updatedAt");

      const boards = db.createObjectStore("boards", {
        keyPath: ["setId", "boardId"],
      });
      boards.createIndex("bySetId", "setId");

      const assets = db.createObjectStore("assets", {
        keyPath: ["setId", "path"],
      });
      assets.createIndex("bySetId", "setId");
      assets.createIndex("bySetIdAndMediaId", ["setId", "mediaId"]);
    },
  });

  return db;
}

export async function withBoardsDB<T>(
  operation: (db: BoardsDB) => Promise<T>,
): Promise<T> {
  const db = await openBoardsDB();
  try {
    return await operation(db);
  } finally {
    db.close();
  }
}

// Board sets — upsert / get / list / delete

export async function upsertBoardSet(
  db: BoardsDB,
  input: UpsertBoardSetInput,
): Promise<void> {
  validateId(input.setId, "setId");
  const tx = db.transaction("boardSets", "readwrite");
  const existing = await tx.store.get(input.setId);

  const record: BoardSetRecord = {
    setId: input.setId,
    name: input.name,
    rootBoardId: input.rootBoardId,
    updatedAt: Date.now(),
    boardCount: existing?.boardCount ?? 0,
    author: input.author ?? existing?.author,
    description: input.description ?? existing?.description,
    license: input.license ?? existing?.license,
    locale: input.locale ?? existing?.locale,
    gridRows: input.gridRows ?? existing?.gridRows,
    gridColumns: input.gridColumns ?? existing?.gridColumns,
  };

  await tx.store.put(record);
  await tx.done;
}

export async function getBoardSet(
  db: BoardsDB,
  setId: string,
): Promise<BoardSetRecord | undefined> {
  validateId(setId, "setId");
  return db.get("boardSets", setId);
}

export async function listBoardSets(db: BoardsDB): Promise<BoardSetRecord[]> {
  const tx = db.transaction("boardSets", "readonly");
  const index = tx.store.index("byUpdatedAt");

  // Manual cursor iteration is required to retrieve records in reverse chronological order;
  // IDB's getAll() does not support a direction argument.
  const boardSets: BoardSetRecord[] = [];
  let cursor = await index.openCursor(undefined, "prev");

  while (cursor) {
    boardSets.push(cursor.value);
    cursor = await cursor.continue();
  }

  await tx.done;
  return boardSets;
}

export async function deleteBoardSet(
  db: BoardsDB,
  setId: string,
): Promise<void> {
  validateId(setId, "setId");
  const tx = db.transaction(["boards", "assets", "boardSets"], "readwrite");

  // Three deletes share one transaction; tx.done commits them together.
  // The [] upper bound exploits IDB key ordering — arrays sort after strings,
  // so [setId, []] is the smallest key greater than every [setId, "..."].
  const setRange = IDBKeyRange.bound([setId], [setId, []]);
  void tx.objectStore("boards").delete(setRange);
  void tx.objectStore("assets").delete(setRange);
  void tx.objectStore("boardSets").delete(setId);

  await tx.done;
}

// Boards — put / get / updateStrings

export async function putBoards(
  db: BoardsDB,
  setId: string,
  boards: UpsertBoardInput[],
): Promise<void> {
  validateId(setId, "setId");
  const tx = db.transaction(["boards", "boardSets"], "readwrite");
  const boardStore = tx.objectStore("boards");

  for (const board of boards) {
    await boardStore.put({
      setId,
      boardId: board.boardId,
      name: board.name,
      obf: board.obf,
    });
  }

  const boardSet = await tx.objectStore("boardSets").get(setId);

  if (boardSet) {
    const count = await boardStore.index("bySetId").count(setId);
    await tx
      .objectStore("boardSets")
      .put({ ...boardSet, boardCount: count, updatedAt: Date.now() });
  }

  await tx.done;
}

export async function getBoard(
  db: BoardsDB,
  setId: string,
  boardId: string,
): Promise<BoardRecord | undefined> {
  validateId(setId, "setId");
  validateId(boardId, "boardId");
  return db.get("boards", [setId, boardId]);
}

export async function updateBoardStrings(
  db: BoardsDB,
  setId: string,
  boardId: string,
  locale: string,
  translations: Record<string, string>,
): Promise<void> {
  validateId(setId, "setId");
  validateId(boardId, "boardId");
  const tx = db.transaction("boards", "readwrite");
  const record = await tx.store.get([setId, boardId]);

  if (!record) {
    throw new Error(`Board not found: ${setId}/${boardId}`);
  }

  const updatedObf = {
    ...record.obf,
    strings: { ...record.obf.strings, [locale]: translations },
  };

  await tx.store.put({ ...record, obf: updatedObf });
  await tx.done;
}

// Assets — put / get

export async function putAssets(
  db: BoardsDB,
  setId: string,
  assets: UpsertAssetInput[],
): Promise<void> {
  validateId(setId, "setId");
  const tx = db.transaction(["assets", "boardSets"], "readwrite");
  const assetStore = tx.objectStore("assets");

  for (const asset of assets) {
    const cleanPath = normalizePath(asset.path);
    await assetStore.put({
      setId,
      path: cleanPath,
      mediaId: asset.mediaId,
      blob: asset.blob,
      mime: asset.mime,
      size: asset.size ?? asset.blob.size,
    });
  }

  const boardSet = await tx.objectStore("boardSets").get(setId);

  if (boardSet) {
    await tx
      .objectStore("boardSets")
      .put({ ...boardSet, updatedAt: Date.now() });
  }

  await tx.done;
}

export async function getAssetBlob(
  db: BoardsDB,
  setId: string,
  path: string,
): Promise<Blob | undefined> {
  validateId(setId, "setId");
  const cleanPath = normalizePath(path);
  const asset = await db.get("assets", [setId, cleanPath]);

  return asset?.blob;
}
