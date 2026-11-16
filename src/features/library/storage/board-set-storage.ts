import type { OBFBoard } from "@shayc/open-board-format";
import type { BoardSetMetadata, StringTranslations } from "../board-types";
import { nonBlankText } from "../non-blank-text";
import {
  type AssetRecord,
  type BoardRecord,
  boardSetRange,
  type BoardSetRecord,
  getBoardsDB,
  runTransaction,
  validateId,
} from "./boards-db";
import { normalizeAssetPath } from "./normalize-asset-path";

export { MAX_ID_LENGTH } from "./boards-db";
export type { BoardSetRecord } from "./boards-db";

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
        await boardStore.put(withTranslations(board, language, translations));
      }
    }

    await boardSetStore.put({
      ...boardSet,
      translatedNames: { ...boardSet.translatedNames, [language]: name },
    });
  });
}

function withTranslations(
  board: BoardRecord,
  language: string,
  translations: StringTranslations,
): BoardRecord {
  const obf = {
    ...board.obf,
    strings: {
      ...board.obf.strings,
      [language]: Object.fromEntries(translations),
    },
  };

  return { ...board, obf };
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

  requestPersistentStorage();
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

  for (const obf of boards) {
    validateId(obf.id, "boardId");
    if (boardIds.has(obf.id)) {
      throw new Error(`Duplicate board ID: ${obf.id}`);
    }

    boardIds.add(obf.id);
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

function buildBoardSetRecord({
  boards,
  assets: _assets,
  ...boardSet
}: BoardSetInput): BoardSetRecord {
  return {
    ...boardSet,
    importedAt: Date.now(),
    boardCount: boards.length,
  };
}

function buildBoardRecords({ id, boards }: BoardSetInput): BoardRecord[] {
  return boards.map((obf) => ({
    boardSetId: id,
    id: obf.id,
    name: nonBlankText(obf.name) ?? obf.id,
    obf,
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

function requestPersistentStorage(): void {
  if (!window.isSecureContext) {
    return;
  }

  // Not awaited: Firefox settles only once the user answers its prompt.
  void navigator.storage.persist();
}
