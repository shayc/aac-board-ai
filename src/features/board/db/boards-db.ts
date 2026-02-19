import type { OBFBoard } from "@shared/open-board-format/schema";
import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";

export interface BoardSetRecord {
  setId: string;
  name: string;
  nameKey: string;
  rootBoardId?: string;
  updatedAt: number;
  boardCount: number;
  author?: string;
  locale?: string;
}
export interface BoardRecord {
  setId: string;
  boardId: string;
  name: string;
  nameKey: string;
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
    indexes: { byNameKey: string; byUpdatedAt: number };
  };
  boards: {
    key: [string, string];
    value: BoardRecord;
    indexes: { bySetId: string; bySetIdNameKey: [string, string] };
  };
  assets: {
    key: [string, string];
    value: AssetRecord;
    indexes: { bySetId: string; bySetIdMediaId: [string, string] };
  };
}

export interface BoardsDBOptions {
  nameKeyLocale?: string | string[];
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

function toNameKey(name: string, locale?: string | string[]): string {
  return name.toLocaleLowerCase(locale).normalize("NFC");
}

function validateId(id: string, name: string): void {
  if (!id || id.length > 255) {
    throw new Error(`Invalid ${name}: must be 1-255 characters`);
  }
}

const meta = new WeakMap<BoardsDB, { locale?: string | string[] }>();

function localeFor(db: BoardsDB) {
  return meta.get(db)?.locale;
}

export async function openBoardsDB(
  opts: BoardsDBOptions = {},
): Promise<BoardsDB> {
  const db = await openDB<BoardsDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const boardsets = db.createObjectStore("boardsets", { keyPath: "setId" });
      boardsets.createIndex("byNameKey", "nameKey");
      boardsets.createIndex("byUpdatedAt", "updatedAt");

      const boards = db.createObjectStore("boards", {
        keyPath: ["setId", "boardId"],
      });
      boards.createIndex("bySetId", "setId");
      boards.createIndex("bySetIdNameKey", ["setId", "nameKey"]);

      const assets = db.createObjectStore("assets", {
        keyPath: ["setId", "path"],
      });
      assets.createIndex("bySetId", "setId");
      assets.createIndex("bySetIdMediaId", ["setId", "mediaId"]);
    },
  });
  meta.set(db, { locale: opts.nameKeyLocale });
  return db;
}

export async function withBoardsDB<T>(
  fn: (db: BoardsDB) => Promise<T>,
  opts?: BoardsDBOptions,
): Promise<T> {
  const db = await openBoardsDB(opts);
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
  boardCount?: number;
  author?: string;
  locale?: string;
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
    nameKey: toNameKey(boardSet.name, localeFor(db)),
    rootBoardId: boardSet.rootBoardId ?? prev?.rootBoardId,
    updatedAt: Date.now(),
    boardCount: boardSet.boardCount ?? prev?.boardCount ?? 0,
    author: boardSet.author ?? prev?.author,
    locale: boardSet.locale ?? prev?.locale,
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
    let delta = 0;

    for (const it of items) {
      const key = [setId, it.boardId] as [string, string];
      const existed = await boards.getKey(key);

      await boards.put({
        setId,
        boardId: it.boardId,
        name: it.name,
        nameKey: toNameKey(it.name, localeFor(db)),
        json: it.json,
      } as BoardRecord);

      if (!existed) {
        delta++;
      }
    }

    const bs = await tx.objectStore("boardsets").get(setId);

    if (bs) {
      const count =
        delta > 0
          ? bs.boardCount + delta
          : await boards.index("bySetId").count(setId);
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
    {
      const idx = tx.objectStore("boards").index("bySetId");
      let c = await idx.openCursor(IDBKeyRange.only(setId));

      while (c) {
        await c.delete();
        c = await c.continue();
      }
    }
    {
      const idx = tx.objectStore("assets").index("bySetId");
      let c = await idx.openCursor(IDBKeyRange.only(setId));

      while (c) {
        await c.delete();
        c = await c.continue();
      }
    }
    await tx.objectStore("boardsets").delete(setId);
    await tx.done;
  } catch (e) {
    tx.abort();
    throw e;
  }
}
