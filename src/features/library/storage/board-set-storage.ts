import { normalizeLocale } from "@shared/language/locale";
import { htmlToText } from "@shared/utils/html-to-text";
import type { OBFBoard } from "@shayc/open-board-format";
import type { StringTranslations } from "../board-types";
import { nonBlankText } from "../non-blank-text";
import {
  type AssetRecord,
  type BoardRecord,
  boardSetRange,
  type BoardSetRecord,
  getBoardsDB,
  normalizeAssetPath,
  runTransaction,
  validateId,
} from "./boards-db";

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
  readonly blob: Blob;
}

export interface BoardSetInput {
  readonly id: string;
  readonly rootBoardId: string;
  readonly name?: string;
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

export async function removeBoardSet(boardSetId: string): Promise<void> {
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

export async function saveBoardSetTranslations(
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

export async function insertBoardSet(input: BoardSetInput): Promise<void> {
  const { id, boards } = input;
  const rootBoard = validateBoardSetInput(input);
  const record = buildBoardSetRecord(input, rootBoard);
  const assetRecords = buildAssetRecords(input);

  const db = await getBoardsDB();
  const tx = db.transaction(["boardSets", "boards", "assets"], "readwrite");
  const boardSetStore = tx.objectStore("boardSets");
  const boardStore = tx.objectStore("boards");
  const assetStore = tx.objectStore("assets");

  await runTransaction(tx, async () => {
    const existing = await boardSetStore.get(id);
    if (existing) {
      throw new BoardSetAlreadyExistsError(id);
    }

    for (const obf of boards) {
      await boardStore.put({
        boardSetId: id,
        id: obf.id,
        name: nonBlankText(obf.name) ?? obf.id,
        obf,
      });
    }

    for (const assetRecord of assetRecords) {
      await assetStore.put(assetRecord);
    }

    await boardSetStore.add(record);
  });

  requestPersistentStorage();
}

function validateBoardSetInput({
  id,
  rootBoardId,
  boards,
}: BoardSetInput): OBFBoard {
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

  const rootBoard = boards.find((obf) => obf.id === rootBoardId);
  if (!rootBoard) {
    throw new Error(`Root board not found: ${rootBoardId}`);
  }

  return rootBoard;
}

function buildBoardSetRecord(
  { id, rootBoardId, name, boards }: BoardSetInput,
  rootBoard: OBFBoard,
): BoardSetRecord {
  return {
    id,
    name: nonBlankText(name) ?? nonBlankText(rootBoard.name) ?? id,
    rootBoardId,
    importedAt: Date.now(),
    boardCount: boards.length,
    author: rootBoard.license?.author_name,
    description: rootBoard.description_html
      ? htmlToText(rootBoard.description_html)
      : undefined,
    license: rootBoard.license?.type,
    locale: rootBoard.locale ? normalizeLocale(rootBoard.locale) : undefined,
    gridRows: rootBoard.grid.rows,
    gridColumns: rootBoard.grid.columns,
  };
}

function buildAssetRecords({ id, assets }: BoardSetInput): AssetRecord[] {
  return assets.map(({ path: rawPath, blob }) => {
    const path = normalizeAssetPath(rawPath);
    if (!path) {
      throw new Error(`Invalid asset path: ${rawPath}`);
    }

    return { boardSetId: id, path, blob };
  });
}

function requestPersistentStorage(): void {
  if (!window.isSecureContext) {
    return;
  }

  // Not awaited: Firefox settles only once the user answers its prompt.
  void navigator.storage.persist();
}
