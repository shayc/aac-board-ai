import type { Board as OBFBoard } from "@/shared/lib/open-board-format/schema";
import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";

export interface Boardset {
  setId: string;
  name: string;
  nameKey: string;
  coverBoardId?: string;
  updatedAt: number;
  boardCount: number;
}
export interface Board {
  setId: string;
  boardId: string;
  name: string;
  nameKey: string;
  json: OBFBoard;
}
export interface Asset {
  setId: string;
  path: string; // normalized POSIX path
  mediaId?: string; // optional cross-ref
  blob: Blob;
  mime?: string;
  size?: number;
}

/** Schema */
interface Schema extends DBSchema {
  boardsets: {
    key: string;
    value: Boardset;
    indexes: { byNameKey: string; byUpdatedAt: number };
  };
  boards: {
    key: [string, string];
    value: Board;
    indexes: { bySetId: string; bySetIdNameKey: [string, string] };
  };
  assets: {
    key: [string, string];
    value: Asset;
    indexes: { bySetId: string; bySetIdMediaId: [string, string] };
  };
}

/** Options */
export interface OpenOptions {
  nameKeyLocale?: string | string[];
}

/** Constants */
export const DB_NAME = "aac-obf";
export const DB_VERSION = 1;

/** Utils */
export function normalizePath(p: string): string {
  if (!p) throw new Error("Path cannot be empty");

  const cleaned = p
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/");

  if (cleaned.includes("..")) {
    throw new Error("Path cannot contain '..'");
  }

  return cleaned;
}

export function toNameKey(name: string, locale?: string | string[]): string {
  return name.toLocaleLowerCase(locale).normalize("NFC");
}

function validateId(id: string, name: string): void {
  if (!id || id.length > 255) {
    throw new Error(`Invalid ${name}: must be 1-255 characters`);
  }
}

const nameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

/** Per-DB metadata (locale) */
const meta = new WeakMap<
  IDBPDatabase<Schema>,
  { locale?: string | string[] }
>();
function localeFor(db: IDBPDatabase<Schema>) {
  return meta.get(db)?.locale;
}

/** Open/Close */
export async function openBoardsDb(
  opts: OpenOptions = {}
): Promise<IDBPDatabase<Schema>> {
  const db = await openDB<Schema>(DB_NAME, DB_VERSION, {
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
export function closeBoardsDb(db: IDBPDatabase<Schema>): void {
  db.close();
}

/** Boardsets */
export async function upsertBoardset(
  db: IDBPDatabase<Schema>,
  input: {
    setId: string;
    name: string;
    coverBoardId?: string;
    boardCount?: number;
  }
): Promise<void> {
  validateId(input.setId, "setId");
  const prev = await db.get("boardsets", input.setId);
  const row: Boardset = {
    setId: input.setId,
    name: input.name,
    nameKey: toNameKey(input.name, localeFor(db)),
    coverBoardId: input.coverBoardId ?? prev?.coverBoardId,
    updatedAt: Date.now(),
    boardCount: input.boardCount ?? prev?.boardCount ?? 0,
  };
  await db.put("boardsets", row);
}
export async function listBoardsets(
  db: IDBPDatabase<Schema>
): Promise<Boardset[]> {
  const tx = db.transaction("boardsets", "readonly");
  const idx = tx.store.index("byUpdatedAt");
  const out: Boardset[] = [];
  let cur = await idx.openCursor(undefined, "prev");
  while (cur) {
    out.push(cur.value);
    cur = await cur.continue();
  }
  await tx.done;
  return out;
}

/** Boards */
export async function bulkPutBoards(
  db: IDBPDatabase<Schema>,
  setId: string,
  items: { boardId: string; name: string; json: OBFBoard }[]
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
      } as Board);
      if (!existed) delta++;
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

export async function listBoards(
  db: IDBPDatabase<Schema>,
  setId: string
): Promise<Board[]> {
  validateId(setId, "setId");
  const rows = await db.getAllFromIndex("boards", "bySetId", setId);
  rows.sort((a, b) => nameCollator.compare(a.name, b.name));
  return rows;
}

export async function searchBoards(
  db: IDBPDatabase<Schema>,
  setId: string,
  query: string,
  limit = 50
): Promise<Board[]> {
  validateId(setId, "setId");
  const key = toNameKey(query, localeFor(db));
  const range = IDBKeyRange.bound([setId, key], [setId, key + "\uffff"]);
  return db.getAllFromIndex("boards", "bySetIdNameKey", range, limit);
}

export async function getBoardsBatch(
  db: IDBPDatabase<Schema>,
  setId: string,
  boardIds: string[]
): Promise<Board[]> {
  validateId(setId, "setId");
  if (boardIds.length === 0) return [];

  const rows = await Promise.all(
    boardIds.map((id) => db.get("boards", [setId, id]))
  );
  return rows.filter((r): r is Board => r !== undefined);
}

/** Assets */
export async function bulkPutAssets(
  db: IDBPDatabase<Schema>,
  setId: string,
  items: {
    path: string;
    blob: Blob;
    mime?: string;
    size?: number;
    mediaId?: string;
  }[]
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
      } as Asset);
    }
    const bs = await tx.objectStore("boardsets").get(setId);
    if (bs)
      await tx.objectStore("boardsets").put({ ...bs, updatedAt: Date.now() });
    await tx.done;
  } catch (e) {
    tx.abort();
    throw e;
  }
}

export async function getAssetUrlByPath(
  db: IDBPDatabase<Schema>,
  setId: string,
  path: string
): Promise<string | null> {
  validateId(setId, "setId");
  const p = normalizePath(path);
  const row = await db.get("assets", [setId, p]);
  return row ? URL.createObjectURL(row.blob) : null;
}

export async function getAssetUrlByMediaId(
  db: IDBPDatabase<Schema>,
  setId: string,
  mediaId: string
): Promise<string | null> {
  validateId(setId, "setId");
  if (!mediaId) return null;
  const row = await db.getFromIndex("assets", "bySetIdMediaId", [
    setId,
    mediaId,
  ]);
  return row ? URL.createObjectURL(row.blob) : null;
}
export async function getManifestJson<T = unknown>(
  db: IDBPDatabase<Schema>,
  setId: string
): Promise<T | null> {
  validateId(setId, "setId");
  const row = await db.get("assets", [setId, "manifest.json"]);
  if (!row) return null;
  try {
    return JSON.parse(await row.blob.text()) as T;
  } catch {
    return null;
  }
}

/** Deletes */
export async function deleteBoardset(
  db: IDBPDatabase<Schema>,
  setId: string
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

export async function deleteBoard(
  db: IDBPDatabase<Schema>,
  setId: string,
  boardId: string
): Promise<void> {
  validateId(setId, "setId");
  validateId(boardId, "boardId");
  const tx = db.transaction(["boards", "boardsets"], "readwrite");
  try {
    await tx.objectStore("boards").delete([setId, boardId]);
    const cnt = await tx.objectStore("boards").index("bySetId").count(setId);
    const bs = await tx.objectStore("boardsets").get(setId);
    if (bs)
      await tx
        .objectStore("boardsets")
        .put({ ...bs, boardCount: cnt, updatedAt: Date.now() });
    await tx.done;
  } catch (e) {
    tx.abort();
    throw e;
  }
}

export async function deleteAsset(
  db: IDBPDatabase<Schema>,
  setId: string,
  path: string
): Promise<void> {
  validateId(setId, "setId");
  const p = normalizePath(path);
  const tx = db.transaction(["assets", "boardsets"], "readwrite");
  try {
    await tx.objectStore("assets").delete([setId, p]);
    const bs = await tx.objectStore("boardsets").get(setId);
    if (bs)
      await tx.objectStore("boardsets").put({ ...bs, updatedAt: Date.now() });
    await tx.done;
  } catch (e) {
    tx.abort();
    throw e;
  }
}
