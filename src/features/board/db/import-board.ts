import { loadOBF, loadOBZ } from "@/shared/open-board-format";
import type { IDBPDatabase } from "idb";
import type { BoardsDBSchema } from "./boards-db";
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
  db: IDBPDatabase<BoardsDBSchema>,
  file: File,
  setId: string
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
    rootBoardId = manifest.root.split("/").pop()?.replace(".obf", "") || "";
  }

  await upsertBoardset(db, {
    setId,
    name: file.name,
    rootBoardId: rootBoardId,
    boardCount: boards.size,
  });

  const boardItems = Array.from(boards.entries()).map(([id, board]) => {
    return {
      boardId: id,
      name: board.name || id,
      json: board,
    };
  });

  await bulkPutBoards(db, setId, boardItems);

  const assetItems = Array.from(files.entries())
    .filter(([path]) => !path.endsWith(".obf") && path !== "manifest.json")
    .map(([path, buffer]) => {
      const mime = path.endsWith(".png")
        ? "image/png"
        : path.endsWith(".jpg") || path.endsWith(".jpeg")
        ? "image/jpeg"
        : path.endsWith(".gif")
        ? "image/gif"
        : path.endsWith(".svg")
        ? "image/svg+xml"
        : path.endsWith(".mp3")
        ? "audio/mpeg"
        : path.endsWith(".wav")
        ? "audio/wav"
        : "application/octet-stream";

      return {
        path,
        blob: new Blob([buffer.buffer as ArrayBuffer], { type: mime }),
        mime,
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
  setId: string
): Promise<ImportResult> {
  const board = await loadOBF(file);

  await upsertBoardset(db, {
    setId,
    name: file.name,
    rootBoardId: board.id,
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
