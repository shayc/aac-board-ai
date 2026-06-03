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
  mediaId?: string;
  blob: Blob;
  mime?: string;
  size?: number;
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
  mime?: string;
  size?: number;
  mediaId?: string;
}

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
}

export async function upsertBoardSet(
  input: UpsertBoardSetInput,
): Promise<void> {
  validateId(input.setId, "setId");
  const db = await getBoardsDB();
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
  setId: string,
): Promise<BoardSetRecord | undefined> {
  validateId(setId, "setId");
  const db = await getBoardsDB();

  return db.get("boardSets", setId);
}

export async function listBoardSets(): Promise<BoardSetRecord[]> {
  const db = await getBoardsDB();
  const tx = db.transaction("boardSets", "readonly");
  const index = tx.store.index("byUpdatedAt");

  const boardSets: BoardSetRecord[] = [];
  let cursor = await index.openCursor(undefined, "prev");

  while (cursor) {
    boardSets.push(cursor.value);
    cursor = await cursor.continue();
  }

  await tx.done;

  return boardSets;
}

export async function deleteBoardSet(setId: string): Promise<void> {
  validateId(setId, "setId");
  const db = await getBoardsDB();
  const tx = db.transaction(["boards", "assets", "boardSets"], "readwrite");

  // The [] upper bound exploits IDB key ordering — arrays sort after strings,
  // so [setId, []] is the smallest key greater than every [setId, "..."].
  const setRange = IDBKeyRange.bound([setId], [setId, []]);
  void tx.objectStore("boards").delete(setRange);
  void tx.objectStore("assets").delete(setRange);
  void tx.objectStore("boardSets").delete(setId);

  await tx.done;
}

export async function putBoards(
  setId: string,
  boards: UpsertBoardInput[],
): Promise<void> {
  validateId(setId, "setId");
  const db = await getBoardsDB();
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
  setId: string,
  boardId: string,
): Promise<BoardRecord | undefined> {
  validateId(setId, "setId");
  validateId(boardId, "boardId");
  const db = await getBoardsDB();

  return db.get("boards", [setId, boardId]);
}

export async function updateBoardStrings(
  setId: string,
  boardId: string,
  locale: string,
  translations: Record<string, string>,
): Promise<void> {
  validateId(setId, "setId");
  validateId(boardId, "boardId");
  const db = await getBoardsDB();
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

export async function putAssets(
  setId: string,
  assets: UpsertAssetInput[],
): Promise<void> {
  validateId(setId, "setId");
  const db = await getBoardsDB();
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
  setId: string,
  path: string,
): Promise<Blob | undefined> {
  validateId(setId, "setId");
  const db = await getBoardsDB();
  const cleanPath = normalizePath(path);
  const asset = await db.get("assets", [setId, cleanPath]);

  return asset?.blob;
}
