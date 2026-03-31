import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";
import type { OBFBoard } from "open-board-format";

export interface BoardSetRecord {
  setId: string;
  name: string;
  rootBoardId?: string;
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
  json: OBFBoard;
}

export interface AssetRecord {
  setId: string;
  path: string;
  mediaId?: string;
  blob: Blob;
  mime?: string;
  size?: number;
}

export interface BoardsDBSchema extends DBSchema {
  boardsets: {
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
    indexes: { bySetId: string; bySetIdMediaId: [string, string] };
  };
}

export type BoardsDB = IDBPDatabase<BoardsDBSchema>;

const DB_NAME = "aac-board-db";
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
  if (!id || id.length > 255) {
    throw new Error(`Invalid ${fieldName}: must be 1-255 characters`);
  }
}

export async function openBoardsDB(): Promise<BoardsDB> {
  const db = await openDB<BoardsDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const boardsets = db.createObjectStore("boardsets", { keyPath: "setId" });
      boardsets.createIndex("byUpdatedAt", "updatedAt");

      const boards = db.createObjectStore("boards", {
        keyPath: ["setId", "boardId"],
      });
      boards.createIndex("bySetId", "setId");

      const assets = db.createObjectStore("assets", {
        keyPath: ["setId", "path"],
      });
      assets.createIndex("bySetId", "setId");
      assets.createIndex("bySetIdMediaId", ["setId", "mediaId"]);
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

export interface UpsertBoardSetInput {
  setId: string;
  name: string;
  rootBoardId?: string;
  author?: string;
  description?: string;
  license?: string;
  locale?: string;
  gridRows?: number;
  gridColumns?: number;
}

export async function upsertBoardSet(
  db: BoardsDB,
  boardSet: UpsertBoardSetInput,
): Promise<void> {
  validateId(boardSet.setId, "setId");
  const existing = await db.get("boardsets", boardSet.setId);

  const record: BoardSetRecord = {
    setId: boardSet.setId,
    name: boardSet.name,
    rootBoardId: boardSet.rootBoardId ?? existing?.rootBoardId,
    updatedAt: Date.now(),
    boardCount: existing?.boardCount ?? 0,
    author: boardSet.author ?? existing?.author,
    description: boardSet.description ?? existing?.description,
    license: boardSet.license ?? existing?.license,
    locale: boardSet.locale ?? existing?.locale,
    gridRows: boardSet.gridRows ?? existing?.gridRows,
    gridColumns: boardSet.gridColumns ?? existing?.gridColumns,
  };

  await db.put("boardsets", record);
}

export async function listBoardSets(db: BoardsDB): Promise<BoardSetRecord[]> {
  const tx = db.transaction("boardsets", "readonly");
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

export interface PutBoardInput {
  boardId: string;
  name: string;
  json: OBFBoard;
}

export async function putBoards(
  db: BoardsDB,
  setId: string,
  boards: PutBoardInput[],
): Promise<void> {
  validateId(setId, "setId");
  const tx = db.transaction(["boards", "boardsets"], "readwrite");

  try {
    const boardStore = tx.objectStore("boards");

    for (const board of boards) {
      await boardStore.put({
        setId,
        boardId: board.boardId,
        name: board.name,
        json: board.json,
      });
    }

    const boardSet = await tx.objectStore("boardsets").get(setId);

    if (boardSet) {
      const count = await boardStore.index("bySetId").count(setId);
      await tx
        .objectStore("boardsets")
        .put({ ...boardSet, boardCount: count, updatedAt: Date.now() });
    }

    await tx.done;
  } catch (error) {
    tx.abort();
    throw error;
  }
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

export async function getBoardsByIds(
  db: BoardsDB,
  setId: string,
  boardIds: string[],
): Promise<BoardRecord[]> {
  validateId(setId, "setId");
  if (boardIds.length === 0) {
    return [];
  }

  const boards = await Promise.all(
    boardIds.map((id) => db.get("boards", [setId, id])),
  );

  return boards.filter((record): record is BoardRecord => record !== undefined);
}

export interface PutAssetInput {
  path: string;
  blob: Blob;
  mime?: string;
  size?: number;
  mediaId?: string;
}

export async function putAssets(
  db: BoardsDB,
  setId: string,
  assets: PutAssetInput[],
): Promise<void> {
  validateId(setId, "setId");
  const tx = db.transaction(["assets", "boardsets"], "readwrite");

  try {
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

    const boardSet = await tx.objectStore("boardsets").get(setId);

    if (boardSet) {
      await tx
        .objectStore("boardsets")
        .put({ ...boardSet, updatedAt: Date.now() });
    }

    await tx.done;
  } catch (error) {
    tx.abort();
    throw error;
  }
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
    throw new Error(`Board not found: ${boardId}`);
  }

  const updatedJson = {
    ...record.json,
    strings: { ...record.json.strings, [locale]: translations },
  };

  await tx.store.put({ ...record, json: updatedJson });
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

export async function deleteBoardSet(
  db: BoardsDB,
  setId: string,
): Promise<void> {
  validateId(setId, "setId");
  const tx = db.transaction(["boards", "assets", "boardsets"], "readwrite");

  try {
    // Fire all three deletes without awaiting individually;
    // they share a single transaction and commit together on tx.done.
    void tx
      .objectStore("boards")
      .delete(IDBKeyRange.bound([setId], [setId, []]));

    void tx
      .objectStore("assets")
      .delete(IDBKeyRange.bound([setId], [setId, []]));

    void tx.objectStore("boardsets").delete(setId);

    await tx.done;
  } catch (error) {
    tx.abort();
    throw error;
  }
}
