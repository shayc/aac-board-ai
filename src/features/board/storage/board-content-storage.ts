import type { BoardKey, StringTranslations } from "../board-types";
import {
  getBoardsDB,
  normalizeAssetPath,
  validateId,
  type BoardRecord,
} from "./boards-db";

export type { BoardRecord } from "./boards-db";

export class BoardNotFoundError extends Error {
  constructor({ boardSetId, boardId }: BoardKey) {
    super(`Board not found: ${boardSetId}/${boardId}`);
    this.name = "BoardNotFoundError";
  }
}

export async function getBoardRecord({
  boardSetId,
  boardId,
}: BoardKey): Promise<BoardRecord | undefined> {
  const db = await getBoardsDB();

  return db.get("boards", [boardSetId, boardId]);
}

export async function listBoardRecords(
  boardSetId: string,
): Promise<BoardRecord[]> {
  const db = await getBoardsDB();

  return db.getAllFromIndex("boards", "byBoardSetId", boardSetId);
}

export async function getAssetBlob(
  boardSetId: string,
  path: string,
): Promise<Blob | undefined> {
  const db = await getBoardsDB();
  const normalizedPath = normalizeAssetPath(path);
  const asset = await db.get("assets", [boardSetId, normalizedPath]);

  return asset?.blob;
}

export async function replaceStringTranslations(
  key: BoardKey,
  language: string,
  translations: StringTranslations,
): Promise<void> {
  const { boardSetId, boardId } = key;
  validateId(boardSetId, "boardSetId");
  validateId(boardId, "boardId");
  const db = await getBoardsDB();
  const tx = db.transaction("boards", "readwrite");
  const record = await tx.store.get([boardSetId, boardId]);

  if (!record) {
    throw new BoardNotFoundError(key);
  }

  const updatedOBF = {
    ...record.obf,
    strings: {
      ...record.obf.strings,
      [language]: Object.fromEntries(translations),
    },
  };

  await tx.store.put({ ...record, obf: updatedOBF });
  await tx.done;
}
