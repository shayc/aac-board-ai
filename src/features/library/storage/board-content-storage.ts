import type { BoardKey } from "../board-types";
import { type BoardRecord, boardSetRange, getBoardsDB } from "./boards-db";
import { normalizeAssetPath } from "./normalize-asset-path";

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

export async function listBoardIds(boardSetId: string): Promise<string[]> {
  const db = await getBoardsDB();
  const keys = await db.getAllKeys("boards", boardSetRange(boardSetId));

  return keys.map(([, boardId]) => boardId);
}

export async function listBoardRecords(
  boardSetId: string,
): Promise<BoardRecord[]> {
  const db = await getBoardsDB();

  return db.getAll("boards", boardSetRange(boardSetId));
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
