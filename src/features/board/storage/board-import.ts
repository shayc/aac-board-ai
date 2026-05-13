import { normalizeLocaleCode } from "@shared/language/locale";
import { stripHtmlTags } from "@shared/utils/html";
import { lookup } from "mrmime";
import { loadOBF, loadOBZ, type OBFBoard } from "open-board-format";
import { resolveLoadBoardPaths } from "../obf/mapper";
import type { BoardsDB, UpsertBoardSetInput } from "./boards-db";
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

export async function importBoardFiles(
  files: File | File[],
): Promise<ImportResult[]> {
  const fileList = Array.isArray(files) ? files : [files];

  return withBoardsDB(async (db) => {
    const results: ImportResult[] = [];

    for (const file of fileList) {
      const setId = deriveSetId(file.name);

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
  const { manifest, boards, resources } = await loadOBZ(file);

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

  await upsertBoardSet(
    db,
    buildBoardSetInput(setId, rootBoard, rootBoardId, file.name),
  );

  const boardPathToId = new Map(
    Object.entries(manifest.paths.boards).map(([id, path]) => [path, id]),
  );

  const boardRecords = Array.from(boards.entries()).map(([id, board]) => ({
    boardId: id,
    name: board.name ?? id,
    obf: resolveLoadBoardPaths(board, boardPathToId),
  }));

  await putBoards(db, setId, boardRecords);

  const assetRecords = Array.from(resources.entries())
    .filter(([path]) => !path.endsWith(".obf") && path !== "manifest.json")
    .map(([path, buffer]) => {
      const mimeType = lookup(path) ?? "application/octet-stream";

      return {
        path,
        mime: mimeType,
        blob: new Blob([buffer.buffer as ArrayBuffer], { type: mimeType }),
      };
    });

  if (assetRecords.length > 0) {
    await putAssets(db, setId, assetRecords);
  }

  return { setId, boardId: rootBoardId };
}

function buildBoardSetInput(
  setId: string,
  board: OBFBoard | undefined,
  rootBoardId: string,
  fallbackSetName: string,
): UpsertBoardSetInput {
  return {
    setId,
    name: board?.name ?? fallbackSetName,
    rootBoardId,
    author: board?.license?.author_name,
    description: board?.description_html
      ? stripHtmlTags(board.description_html)
      : undefined,
    license: board?.license?.type,
    locale: board?.locale ? normalizeLocaleCode(board.locale) : undefined,
    gridRows: board?.grid.rows,
    gridColumns: board?.grid.columns,
  };
}

async function importOBFFile(
  db: BoardsDB,
  file: File,
  setId: string,
): Promise<ImportResult> {
  const board = await loadOBF(file);

  await upsertBoardSet(
    db,
    buildBoardSetInput(setId, board, board.id, file.name),
  );

  await putBoards(db, setId, [
    {
      boardId: board.id,
      name: board.name ?? board.id,
      obf: board,
    },
  ]);

  return { setId, boardId: board.id };
}

function deriveSetId(filename: string): string {
  return filename.replace(/\.(obz|obf)$/i, "").toLowerCase();
}
