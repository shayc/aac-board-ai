import { loadOBF, loadOBZ } from "@shared/open-board-format";
import type { IDBPDatabase } from "idb";
import { lookup } from "mrmime";
import type { BoardsDBSchema } from "./boards-db";
import {
  bulkPutAssets,
  bulkPutBoards,
  openBoardsDB,
  upsertBoardSet,
} from "./boards-db";

export interface ImportResult {
  setId: string;
  boardId: string;
}

export async function importFiles(
  input: File | File[],
): Promise<ImportResult[]> {
  const files = Array.isArray(input) ? input : [input];
  const db = await openBoardsDB();

  try {
    const results: ImportResult[] = [];

    for (const file of files) {
      const setId = file.name.replace(/\.(obz|obf)$/i, "").toLowerCase();

      if (file.name.toLowerCase().endsWith(".obz")) {
        results.push(await importOBZFile(db, file, setId));
      } else {
        results.push(await importOBFFile(db, file, setId));
      }
    }

    return results;
  } finally {
    db.close();
  }
}

async function importOBZFile(
  db: IDBPDatabase<BoardsDBSchema>,
  file: File,
  setId: string,
): Promise<ImportResult> {
  const { manifest, boards, files } = await loadOBZ(file);

  let rootBoardId = "";
  for (const [id, path] of Object.entries(manifest.paths.boards)) {
    if (path === manifest.root) {
      rootBoardId = id;
      break;
    }
  }

  if (!rootBoardId) {
    rootBoardId = manifest.root.split("/").pop()?.replace(".obf", "") ?? "";
  }

  await upsertBoardSet(db, {
    setId,
    name: file.name.replace(/\.(obz|obf)$/i, ""),
    rootBoardId: rootBoardId,
    boardCount: boards.size,
  });

  const boardItems = Array.from(boards.entries()).map(([id, board]) => {
    return {
      boardId: id,
      name: board.name ?? id,
      json: board,
    };
  });

  await bulkPutBoards(db, setId, boardItems);

  const assetItems = Array.from(files.entries())
    .filter(([path]) => !path.endsWith(".obf") && path !== "manifest.json")
    .map(([path, buffer]) => {
      const mime = lookup(path) ?? "application/octet-stream";

      return {
        path,
        mime,
        blob: new Blob([buffer.buffer as ArrayBuffer], { type: mime }),
      };
    });

  if (assetItems.length > 0) {
    await bulkPutAssets(db, setId, assetItems);
  }

  return { setId, boardId: rootBoardId };
}

async function importOBFFile(
  db: IDBPDatabase<BoardsDBSchema>,
  file: File,
  setId: string,
): Promise<ImportResult> {
  const board = await loadOBF(file);

  await upsertBoardSet(db, {
    setId,
    name: file.name.replace(/\.(obz|obf)$/i, ""),
    rootBoardId: board.id,
    boardCount: 1,
  });

  await bulkPutBoards(db, setId, [
    {
      boardId: board.id,
      name: board.name ?? board.id,
      json: board,
    },
  ]);

  return { setId, boardId: board.id };
}
