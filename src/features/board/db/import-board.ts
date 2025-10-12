import { loadOBF, loadOBZ } from "@/shared/lib/open-board-format";
import type { IDBPDatabase } from "idb";
import type { Schema } from "./boards-db";
import {
  bulkPutAssets,
  bulkPutBoards,
  openBoardsDb,
  upsertBoardset,
} from "./boards-db";

export interface ImportResult {
  setId: string;
  boardId: string;
}

/**
 * Import OBZ or OBF file into IndexedDB
 */
export async function importFile(file: File): Promise<ImportResult> {
  const db = await openBoardsDb();
  const setId = file.name.replace(/\.(obz|obf)$/i, "").toLowerCase();

  try {
    if (file.name.toLowerCase().endsWith(".obz")) {
      return await importOBZFile(db, file, setId);
    } else {
      return await importOBFFile(db, file, setId);
    }
  } finally {
    db.close();
  }
}

async function importOBZFile(
  db: IDBPDatabase<Schema>,
  file: File,
  setId: string
): Promise<ImportResult> {
  const { manifest, boards, files } = await loadOBZ(file);
  const rootBoardId =
    manifest.root.split("/").pop()?.replace(".obf", "") || "";

  // Create boardset
  await upsertBoardset(db, {
    setId,
    name: file.name,
    coverBoardId: rootBoardId,
    boardCount: boards.size,
  });

  // Import boards
  const boardItems = Array.from(boards.entries()).map(([id, board]) => ({
    boardId: id,
    name: board.name || id,
    json: board,
  }));
  await bulkPutBoards(db, setId, boardItems);

  // Import assets (images, sounds, etc.)
  const assetItems = Array.from(files.entries())
    .filter(([path]) => !path.endsWith(".obf") && path !== "manifest.json")
    .map(([path, buffer]) => ({
      path,
      blob: new Blob([buffer.buffer as ArrayBuffer]),
    }));

  if (assetItems.length > 0) {
    await bulkPutAssets(db, setId, assetItems);
  }

  return { setId, boardId: rootBoardId };
}

async function importOBFFile(
  db: IDBPDatabase<Schema>,
  file: File,
  setId: string
): Promise<ImportResult> {
  const board = await loadOBF(file);

  await upsertBoardset(db, {
    setId,
    name: file.name,
    coverBoardId: board.id,
    boardCount: 1,
  });

  await bulkPutBoards(db, setId, [
    {
      boardId: board.id,
      name: board.name || board.id,
      json: board,
    },
  ]);

  return { setId, boardId: board.id };
}