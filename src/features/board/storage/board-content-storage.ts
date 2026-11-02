import {
  getBoardsDB,
  normalizeAssetPath,
  validateId,
  type BoardRecord,
} from "./boards-db";

export type { BoardRecord } from "./boards-db";

export class BoardNotFoundError extends Error {
  constructor(boardSetId: string, boardId: string) {
    super(`Board not found: ${boardSetId}/${boardId}`);
    this.name = "BoardNotFoundError";
  }
}

export async function getBoardRecord(
  boardSetId: string,
  boardId: string,
): Promise<BoardRecord | undefined> {
  validateId(boardSetId, "boardSetId");
  validateId(boardId, "boardId");
  const db = await getBoardsDB();

  return db.get("boards", [boardSetId, boardId]);
}

export async function listBoardRecords(
  boardSetId: string,
): Promise<BoardRecord[]> {
  validateId(boardSetId, "boardSetId");
  const db = await getBoardsDB();

  return db.getAllFromIndex("boards", "byBoardSetId", boardSetId);
}

export async function getAssetBlob(
  boardSetId: string,
  path: string,
): Promise<Blob | undefined> {
  validateId(boardSetId, "boardSetId");
  const db = await getBoardsDB();
  const normalizedPath = normalizeAssetPath(path);
  const asset = await db.get("assets", [boardSetId, normalizedPath]);

  return asset?.blob;
}

export async function updateBoardStrings(
  boardSetId: string,
  boardId: string,
  language: string,
  translations: Record<string, string>,
): Promise<void> {
  validateId(boardSetId, "boardSetId");
  validateId(boardId, "boardId");
  const db = await getBoardsDB();
  const tx = db.transaction("boards", "readwrite");
  const record = await tx.store.get([boardSetId, boardId]);

  if (!record) {
    throw new BoardNotFoundError(boardSetId, boardId);
  }

  const updatedObf = {
    ...record.obf,
    strings: { ...record.obf.strings, [language]: translations },
  };

  await tx.store.put({ ...record, obf: updatedObf });
  await tx.done;
}
