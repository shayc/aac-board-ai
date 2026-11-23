import type { OBFBoard } from "@shayc/open-board-format";
import type { StringTranslations } from "../board-types";
import { withOBFStrings } from "../obf/obf-strings";
import type { BoardSetMetadata } from "../obf/obf-to-board-set-metadata";
import {
  type AssetRecord,
  type BoardRecord,
  boardSetRange,
  type BoardSetRecord,
  getBoardsDB,
  runTransaction,
} from "./boards-db";
import { normalizeAssetPath } from "./normalize-asset-path";

export type { BoardSetRecord } from "./boards-db";

export const MAX_ID_LENGTH = 255;

export class BoardSetAlreadyExistsError extends Error {
  constructor(boardSetId: string) {
    super(`Board set already exists: ${boardSetId}`);
    this.name = "BoardSetAlreadyExistsError";
  }
}

export interface AssetInput {
  readonly path: string;
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly type: string;
}

export interface BoardSetInput extends BoardSetMetadata {
  readonly id: string;
  readonly rootBoardId: string;
  readonly boards: readonly OBFBoard[];
  readonly assets: readonly AssetInput[];
}

export async function getBoardSetRecord(
  boardSetId: string,
): Promise<BoardSetRecord | undefined> {
  const db = await getBoardsDB();

  return db.get("boardSets", boardSetId);
}

export async function listBoardSetRecords(): Promise<BoardSetRecord[]> {
  const db = await getBoardsDB();
  const boardSets = await db.getAllFromIndex("boardSets", "byImportedAt");

  return boardSets.reverse();
}

export async function deleteBoardSetRecords(boardSetId: string): Promise<void> {
  const db = await getBoardsDB();
  const tx = db.transaction(["boards", "assets", "boardSets"], "readwrite");
  const keyRange = boardSetRange(boardSetId);

  await Promise.all([
    tx.objectStore("boards").delete(keyRange),
    tx.objectStore("assets").delete(keyRange),
    tx.objectStore("boardSets").delete(boardSetId),
    tx.done,
  ]);
}

export interface BoardSetTranslations {
  readonly name: string;
  readonly translationsByBoardId: ReadonlyMap<string, StringTranslations>;
}

export async function updateBoardSetTranslations(
  boardSetId: string,
  language: string,
  { name, translationsByBoardId }: BoardSetTranslations,
): Promise<void> {
  const db = await getBoardsDB();
  const tx = db.transaction(["boardSets", "boards"], "readwrite");
  const boardSetStore = tx.objectStore("boardSets");
  const boardStore = tx.objectStore("boards");

  await runTransaction(tx, async () => {
    const boardSet = await boardSetStore.get(boardSetId);
    // A set deleted while it was being translated must not regain its boards.
    if (!boardSet) {
      return;
    }

    for (const [boardId, translations] of translationsByBoardId) {
      const board = await boardStore.get([boardSetId, boardId]);
      if (board) {
        await boardStore.put({
          ...board,
          obf: withOBFStrings(board.obf, language, translations),
        });
      }
    }

    await boardSetStore.put({
      ...boardSet,
      translatedNames: { ...boardSet.translatedNames, [language]: name },
    });
  });
}

export async function insertBoardSetRecords(
  input: BoardSetInput,
): Promise<void> {
  validateBoardSetInput(input);

  const boardSetRecord = buildBoardSetRecord(input);
  const boardRecords = buildBoardRecords(input);
  const assetRecords = buildAssetRecords(input);

  const db = await getBoardsDB();
  const tx = db.transaction(["boardSets", "boards", "assets"], "readwrite");
  const boardSetStore = tx.objectStore("boardSets");
  const boardStore = tx.objectStore("boards");
  const assetStore = tx.objectStore("assets");

  await runTransaction(tx, async () => {
    const existing = await boardSetStore.get(input.id);
    if (existing) {
      throw new BoardSetAlreadyExistsError(input.id);
    }

    for (const boardRecord of boardRecords) {
      await boardStore.put(boardRecord);
    }

    for (const assetRecord of assetRecords) {
      await assetStore.put(assetRecord);
    }

    await boardSetStore.add(boardSetRecord);
  });
}

function validateBoardSetInput({
  id,
  rootBoardId,
  boards,
  assets,
}: BoardSetInput): void {
  validateId(id, "boardSetId");
  validateId(rootBoardId, "rootBoardId");

  const boardIds = new Set<string>();

  for (const obfBoard of boards) {
    validateId(obfBoard.id, "boardId");
    if (boardIds.has(obfBoard.id)) {
      throw new Error(`Duplicate board ID: ${obfBoard.id}`);
    }

    boardIds.add(obfBoard.id);
  }

  for (const { path } of assets) {
    if (!normalizeAssetPath(path)) {
      throw new Error(`Invalid asset path: ${path}`);
    }
  }

  if (!boardIds.has(rootBoardId)) {
    throw new Error(`Root board not found: ${rootBoardId}`);
  }
}

function validateId(id: string, fieldName: string): void {
  if (!id || id.length > MAX_ID_LENGTH) {
    throw new Error(
      `Invalid ${fieldName}: must be 1-${MAX_ID_LENGTH} characters`,
    );
  }
}

function buildBoardSetRecord(input: BoardSetInput): BoardSetRecord {
  return {
    id: input.id,
    name: input.name,
    rootBoardId: input.rootBoardId,
    importedAt: Date.now(),
    boardCount: input.boards.length,
    author: input.author,
    description: input.description,
    license: input.license,
    locale: input.locale,
    gridRows: input.gridRows,
    gridColumns: input.gridColumns,
  };
}

function buildBoardRecords({ id, boards }: BoardSetInput): BoardRecord[] {
  return boards.map((obfBoard) => ({
    boardSetId: id,
    id: obfBoard.id,
    obf: obfBoard,
  }));
}

function buildAssetRecords({ id, assets }: BoardSetInput): AssetRecord[] {
  return assets.map(({ path, bytes, type }) => ({
    boardSetId: id,
    path: normalizeAssetPath(path),
    bytes: exactBuffer(bytes),
    type,
  }));
}

// A view can cover part of a larger buffer; only its own bytes are stored.
function exactBuffer(bytes: Uint8Array<ArrayBuffer>): ArrayBuffer {
  const { buffer, byteOffset, byteLength } = bytes;
  if (byteOffset === 0 && byteLength === buffer.byteLength) {
    return buffer;
  }

  return buffer.slice(byteOffset, byteOffset + byteLength);
}
