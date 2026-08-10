import {
  getBoardsDB,
  normalizeAssetPath,
  validateId,
  type BoardRecord,
} from "./boards-db";

export type { BoardRecord } from "./boards-db";

export class BoardNotFoundError extends Error {
  constructor(setId: string, boardId: string) {
    super(`Board not found: ${setId}/${boardId}`);
    this.name = "BoardNotFoundError";
  }
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

export async function listBoards(setId: string): Promise<BoardRecord[]> {
  validateId(setId, "setId");
  const db = await getBoardsDB();

  return db.getAllFromIndex("boards", "bySetId", setId);
}

export async function getAssetBlob(
  setId: string,
  path: string,
): Promise<Blob | undefined> {
  validateId(setId, "setId");
  const db = await getBoardsDB();
  const cleanPath = normalizeAssetPath(path);
  const asset = await db.get("assets", [setId, cleanPath]);

  return asset?.blob;
}

export async function updateBoardStrings(
  setId: string,
  boardId: string,
  language: string,
  translations: Record<string, string>,
): Promise<void> {
  validateId(setId, "setId");
  validateId(boardId, "boardId");
  const db = await getBoardsDB();
  const tx = db.transaction("boards", "readwrite");
  const record = await tx.store.get([setId, boardId]);

  if (!record) {
    throw new BoardNotFoundError(setId, boardId);
  }

  const updatedObf = {
    ...record.obf,
    strings: { ...record.obf.strings, [language]: translations },
  };

  await tx.store.put({ ...record, obf: updatedObf });
  await tx.done;
}
