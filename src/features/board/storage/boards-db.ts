import type { OBFBoard } from "@shayc/open-board-format";
import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";

export interface BoardSetRecord {
  readonly id: string;
  readonly name: string;
  readonly rootBoardId: string;
  readonly updatedAt: number;
  readonly boardCount: number;
  readonly author?: string;
  readonly description?: string;
  readonly license?: string;
  readonly locale?: string;
  /** Language code → set name, translated on this device. */
  readonly translatedNames?: Readonly<Record<string, string>>;
  readonly gridRows?: number;
  readonly gridColumns?: number;
}

export interface BoardRecord {
  readonly boardSetId: string;
  readonly id: string;
  readonly name: string;
  readonly obf: OBFBoard;
}

interface AssetRecord {
  readonly boardSetId: string;
  readonly path: string;
  readonly blob: Blob;
}

export const MAX_ID_LENGTH = 255;

export class InvalidIdError extends Error {
  constructor(fieldName: string) {
    super(`Invalid ${fieldName}: must be 1-${MAX_ID_LENGTH} characters`);
    this.name = "InvalidIdError";
  }
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
    indexes: { byBoardSetId: string };
  };
  assets: {
    key: [string, string];
    value: AssetRecord;
    indexes: { byBoardSetId: string };
  };
}

type BoardsDB = IDBPDatabase<BoardsDBSchema>;

const DB_NAME = "boards-db";
const DB_VERSION = 1;

export function normalizeAssetPath(rawPath: string): string {
  const path = rawPath
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/{2,}/g, "/");

  if (!path) {
    throw new Error("Path cannot be empty");
  }

  return path;
}

export function validateId(id: string, fieldName: string): void {
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

/**
 * Runs `write` and resolves once `tx` commits. When `write` fails, the
 * transaction is aborted so nothing it already wrote is kept. A put() that
 * throws synchronously (e.g. a non-cloneable value) would otherwise leave the
 * transaction open to commit the earlier writes. idb creates tx.done eagerly,
 * so it is awaited either way, or its rejection goes unhandled.
 *
 * `write` must await each request before issuing the next. Requests left
 * running when a later one throws would reject after the abort, unhandled.
 */
export async function runTransaction(
  tx: { readonly done: Promise<void>; abort: () => void },
  write: () => Promise<void>,
): Promise<void> {
  const writing = write();

  try {
    await Promise.all([writing, tx.done]);
  } catch (error) {
    try {
      tx.abort();
    } catch {
      // Already finished — the transaction aborted itself.
    }

    await Promise.allSettled([writing, tx.done]);
    throw error;
  }
}

function openConnection(): Promise<BoardsDB> {
  return openDB<BoardsDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const boardSets = db.createObjectStore("boardSets", { keyPath: "id" });
        boardSets.createIndex("byUpdatedAt", "updatedAt");

        const boards = db.createObjectStore("boards", {
          keyPath: ["boardSetId", "id"],
        });
        boards.createIndex("byBoardSetId", "boardSetId");

        const assets = db.createObjectStore("assets", {
          keyPath: ["boardSetId", "path"],
        });
        assets.createIndex("byBoardSetId", "boardSetId");
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
