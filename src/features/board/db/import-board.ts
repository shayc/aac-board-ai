import { loadOBF, loadOBZ } from "@/shared/lib/open-board-format";
import type { IDBPDatabase } from "idb";
import type { Schema } from "./boards-db";
import {
  bulkPutAssets,
  bulkPutBoards,
  openBoardsDB,
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
  const db = await openBoardsDB();
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
  
  // DEBUG: Log manifest to see board IDs
  console.log("🔍 DEBUG - Manifest:", JSON.stringify(manifest, null, 2));
  console.log("🔍 DEBUG - Manifest.paths.boards:", manifest.paths.boards);
  console.log("🔍 DEBUG - Manifest.root path:", manifest.root);
  
  // Find the board ID by matching the root path to manifest.paths.boards
  let rootBoardId = "";
  for (const [id, path] of Object.entries(manifest.paths.boards)) {
    if (path === manifest.root) {
      rootBoardId = id;
      break;
    }
  }
  
  // Fallback: if no match found, extract from path (old behavior)
  if (!rootBoardId) {
    rootBoardId = manifest.root.split("/").pop()?.replace(".obf", "") || "";
    console.warn("🔍 DEBUG - Could not find root board ID in manifest.paths.boards, using filename fallback:", rootBoardId);
  }
  
  console.log("🔍 DEBUG - Root board ID resolved:", rootBoardId);
  console.log("🔍 DEBUG - All board IDs from manifest:", Object.keys(manifest.paths.boards));

  // Create boardset
  await upsertBoardset(db, {
    setId,
    name: file.name,
    coverBoardId: rootBoardId,
    boardCount: boards.size,
  });

  // Import boards
  const boardItems = Array.from(boards.entries()).map(([id, board]) => {
    console.log(`🔍 DEBUG - Board from manifest key "${id}":`, {
      boardIdFromManifest: id,
      boardIdFromJson: board.id,
      boardName: board.name
    });
    return {
      boardId: id,
      name: board.name || id,
      json: board,
    };
  });
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