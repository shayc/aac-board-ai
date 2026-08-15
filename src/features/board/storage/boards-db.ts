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

interface AssetRecord {
  setId: string;
  path: string;
  blob: Blob;
}

const MAX_ID_LENGTH = 255;

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
    indexes: { bySetId: string };
  };
  assets: {
    key: [string, string];
    value: AssetRecord;
    indexes: { bySetId: string };
  };
}

type BoardsDB = IDBPDatabase<BoardsDBSchema>;

const DB_NAME = "aac-boards-db";
const DB_VERSION = 1;

export function normalizeAssetPath(rawPath: string): string {
  const path = rawPath
    .replace(/\\/g, "/")
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
