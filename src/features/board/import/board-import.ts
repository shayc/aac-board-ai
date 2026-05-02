import { normalizeLocaleCode } from "@shared/language/locale";
import { stripHtmlTags } from "@shared/utils/html";
import { lookup } from "mrmime";
import { loadOBF, loadOBZ, type OBFBoard } from "open-board-format";
import type { BoardsDB, UpsertBoardSetInput } from "../storage/boards-db";
import {
  putAssets,
  putBoards,
  upsertBoardSet,
  withBoardsDB,
} from "../storage/boards-db";
import { resolveLoadBoardPaths } from "./obf-mapper";

export interface ImportResult {
  setId: string;
  boardId: string;
}

export async function storeBoardFiles(
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
  const { manifest, boards: obfBoards, resources } = await loadOBZ(file);

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

  const rootObfBoard = obfBoards.get(rootBoardId);

  await upsertBoardSet(
    db,
    buildBoardSetInput(setId, rootObfBoard, rootBoardId, file.name),
  );

  const pathToId = new Map(
    Object.entries(manifest.paths.boards).map(([id, path]) => [path, id]),
  );

  const boardItems = Array.from(obfBoards.entries()).map(([id, obfBoard]) => ({
    boardId: id,
    name: obfBoard.name ?? id,
    json: resolveLoadBoardPaths(obfBoard, pathToId),
  }));

  await putBoards(db, setId, boardItems);

  const assetItems = Array.from(resources.entries())
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

function buildBoardSetInput(
  setId: string,
  obfBoard: OBFBoard | undefined,
  rootBoardId: string,
  fallbackName: string,
): UpsertBoardSetInput {
  return {
    setId,
    name: obfBoard?.name ?? fallbackName,
    rootBoardId,
    author: obfBoard?.license?.author_name,
    description: obfBoard?.description_html
      ? stripHtmlTags(obfBoard.description_html)
      : undefined,
    license: obfBoard?.license?.type,
    locale: obfBoard?.locale ? normalizeLocaleCode(obfBoard.locale) : undefined,
    gridRows: obfBoard?.grid.rows,
    gridColumns: obfBoard?.grid.columns,
  };
}

async function importOBFFile(
  db: BoardsDB,
  file: File,
  setId: string,
): Promise<ImportResult> {
  const obfBoard = await loadOBF(file);

  await upsertBoardSet(
    db,
    buildBoardSetInput(setId, obfBoard, obfBoard.id, file.name),
  );

  await putBoards(db, setId, [
    {
      boardId: obfBoard.id,
      name: obfBoard.name ?? obfBoard.id,
      json: obfBoard,
    },
  ]);

  return { setId, boardId: obfBoard.id };
}
