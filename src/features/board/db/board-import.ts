import { loadOBF, loadOBZ } from "@shared/open-board-format";
import type { OBFBoard } from "@shared/open-board-format/schema";
import { lookup } from "mrmime";
import type { BoardsDB } from "./boards-db";
import {
  putAssets,
  putBoards,
  upsertBoardSet,
  withBoardsDB,
} from "./boards-db";

export interface ImportResult {
  setId: string;
  boardId: string;
}

export async function importFiles(
  input: File | File[],
): Promise<ImportResult[]> {
  const files = Array.isArray(input) ? input : [input];

  return withBoardsDB(async (db) => {
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
  });
}

async function importOBZFile(
  db: BoardsDB,
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

  const rootBoard = boards.get(rootBoardId);

  await upsertBoardSet(db, {
    setId,
    name: rootBoard?.name ?? file.name,
    rootBoardId: rootBoardId,
    author: rootBoard?.license?.author_name,
    locale: rootBoard?.locale,
    gridRows: rootBoard?.grid.rows,
    gridColumns: rootBoard?.grid.columns,
  });

  const pathToId = new Map(
    Object.entries(manifest.paths.boards).map(([id, path]) => [path, id]),
  );

  const boardItems = Array.from(boards.entries()).map(([id, board]) => ({
    boardId: id,
    name: board.name ?? id,
    json: resolveLoadBoardPaths(board, pathToId),
  }));

  await putBoards(db, setId, boardItems);

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
    await putAssets(db, setId, assetItems);
  }

  return { setId, boardId: rootBoardId };
}

function resolveLoadBoardPaths(
  board: OBFBoard,
  pathToId: Map<string, string>,
): OBFBoard {
  const buttons = board.buttons.map((button) => {
    if (!button.load_board?.path || button.load_board.id) {
      return button;
    }

    const resolvedId = pathToId.get(button.load_board.path);
    if (!resolvedId) {
      return button;
    }

    return {
      ...button,
      load_board: { ...button.load_board, id: resolvedId },
    };
  });

  return { ...board, buttons };
}

async function importOBFFile(
  db: BoardsDB,
  file: File,
  setId: string,
): Promise<ImportResult> {
  const board = await loadOBF(file);

  await upsertBoardSet(db, {
    setId,
    name: board.name ?? file.name,
    rootBoardId: board.id,
    author: board.license?.author_name,
    locale: board.locale,
    gridRows: board.grid.rows,
    gridColumns: board.grid.columns,
  });

  await putBoards(db, setId, [
    {
      boardId: board.id,
      name: board.name ?? board.id,
      json: board,
    },
  ]);

  return { setId, boardId: board.id };
}
