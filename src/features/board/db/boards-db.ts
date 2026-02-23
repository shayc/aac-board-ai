import type { OBFBoard } from "open-board-format";
import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";

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

function normalizePath(p: string): string {
  if (!p) throw new Error("Path cannot be empty");

  const cleaned = p
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/");

  return cleaned;
}

function validateId(id: string, name: string): void {
  if (!id || id.length > 255) {
    throw new Error(`Invalid ${name}: must be 1-255 characters`);
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
  fn: (db: BoardsDB) => Promise<T>,
): Promise<T> {
  const db = await openBoardsDB();
  try {
    return await fn(db);
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
  const prev = await db.get("boardsets", boardSet.setId);

  const row: BoardSetRecord = {
    setId: boardSet.setId,
    name: boardSet.name,
    rootBoardId: boardSet.rootBoardId ?? prev?.rootBoardId,
    updatedAt: Date.now(),
    boardCount: prev?.boardCount ?? 0,
    author: boardSet.author ?? prev?.author,
    description: boardSet.description ?? prev?.description,
    license: boardSet.license ?? prev?.license,
    locale: boardSet.locale ?? prev?.locale,
    gridRows: boardSet.gridRows ?? prev?.gridRows,
    gridColumns: boardSet.gridColumns ?? prev?.gridColumns,
  };

  await db.put("boardsets", row);
}

export async function listBoardSets(db: BoardsDB): Promise<BoardSetRecord[]> {
  const tx = db.transaction("boardsets", "readonly");
  const idx = tx.store.index("byUpdatedAt");
  const out: BoardSetRecord[] = [];
  let cur = await idx.openCursor(undefined, "prev");

  while (cur) {
    out.push(cur.value);
    cur = await cur.continue();
  }

  await tx.done;
  return out;
}

export interface PutBoardInput {
  boardId: string;
  name: string;
  json: OBFBoard;
}

export async function putBoards(
  db: BoardsDB,
  setId: string,
  items: PutBoardInput[],
): Promise<void> {
  validateId(setId, "setId");
  const tx = db.transaction(["boards", "boardsets"], "readwrite");

  try {
    const boards = tx.objectStore("boards");

    for (const it of items) {
      await boards.put({
        setId,
        boardId: it.boardId,
        name: it.name,
        json: it.json,
      } as BoardRecord);
    }

    const bs = await tx.objectStore("boardsets").get(setId);

    if (bs) {
      const count = await boards.index("bySetId").count(setId);
      await tx
        .objectStore("boardsets")
        .put({ ...bs, boardCount: count, updatedAt: Date.now() });
    }

    await tx.done;
  } catch (e) {
    tx.abort();
    throw e;
  }
}

export async function getBoard(
  db: BoardsDB,
  setId: string,
  boardId: string,
): Promise<BoardRecord | undefined> {
  validateId(setId, "setId");
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

  const rows = await Promise.all(
    boardIds.map((id) => db.get("boards", [setId, id])),
  );

  return rows.filter((r): r is BoardRecord => r !== undefined);
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
  items: PutAssetInput[],
): Promise<void> {
  validateId(setId, "setId");
  const tx = db.transaction(["assets", "boardsets"], "readwrite");

  try {
    const assets = tx.objectStore("assets");
    for (const it of items) {
      const path = normalizePath(it.path);
      await assets.put({
        setId,
        path,
        mediaId: it.mediaId,
        blob: it.blob,
        mime: it.mime,
        size: it.size ?? it.blob.size,
      } as AssetRecord);
    }

    const bs = await tx.objectStore("boardsets").get(setId);

    if (bs) {
      await tx.objectStore("boardsets").put({ ...bs, updatedAt: Date.now() });
    }

    await tx.done;
  } catch (e) {
    tx.abort();
    throw e;
  }
}

export async function updateBoardStrings(
  db: BoardsDB,
  setId: string,
  boardId: string,
  locale: string,
  localizedStrings: Record<string, string>,
): Promise<void> {
  validateId(setId, "setId");
  const record = await db.get("boards", [setId, boardId]);

  if (!record) {
    throw new Error(`Board not found: ${boardId}`);
  }

  const updatedJson = {
    ...record.json,
    strings: { ...record.json.strings, [locale]: localizedStrings },
  };

  await db.put("boards", { ...record, json: updatedJson });
}

export async function getAssetBlob(
  db: BoardsDB,
  setId: string,
  path: string,
): Promise<Blob | null> {
  validateId(setId, "setId");
  const normalizedPath = normalizePath(path);
  const row = await db.get("assets", [setId, normalizedPath]);

  return row?.blob ?? null;
}

export async function deleteBoardSet(
  db: BoardsDB,
  setId: string,
): Promise<void> {
  validateId(setId, "setId");
  const tx = db.transaction(["boards", "assets", "boardsets"], "readwrite");

  try {
    void tx
      .objectStore("boards")
      .delete(IDBKeyRange.bound([setId], [setId, []]));

    void tx
      .objectStore("assets")
      .delete(IDBKeyRange.bound([setId], [setId, []]));

    void tx.objectStore("boardsets").delete(setId);

    await tx.done;
  } catch (e) {
    tx.abort();
    throw e;
  }
}
