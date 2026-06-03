import { htmlToText } from "@shared/utils/html";
import { normalizeLocale } from "@shared/utils/locale";
import { lookup } from "mrmime";
import {
  loadOBF,
  loadOBZ,
  type OBFBoard,
  type OBFManifest,
} from "@shayc/open-board-format";
import { resolveLoadBoardPaths } from "../obf/obf-to-board";
import { notifyBoardSetsChanged } from "../storage/board-sets-store";
import type {
  UpsertAssetInput,
  UpsertBoardInput,
  UpsertBoardSetInput,
} from "../storage/db";
import { putAssets, putBoards, upsertBoardSet } from "../storage/db";

export interface ImportResult {
  setId: string;
  boardId: string;
}

export async function importBoardFiles(
  files: File | File[],
): Promise<ImportResult[]> {
  const results = await importFilesAsBoardSets(files);
  await notifyBoardSetsChanged();

  return results;
}

export async function importFilesAsBoardSets(
  files: File | File[],
): Promise<ImportResult[]> {
  const fileList = Array.isArray(files) ? files : [files];
  const results: ImportResult[] = [];

  for (const file of fileList) {
    const setId = deriveSetId(file.name);

    if (file.name.toLowerCase().endsWith(".obz")) {
      results.push(await importOBZFile(file, setId));
    } else {
      results.push(await importOBFFile(file, setId));
    }
  }

  return results;
}

async function importOBZFile(file: File, setId: string): Promise<ImportResult> {
  const { manifest, boards, resources } = await loadOBZ(file);
  const boardPathToId = buildBoardPathIndex(manifest);

  const rootBoardId = resolveRootBoardId(manifest, boardPathToId);
  const rootBoard = boards.get(rootBoardId);

  await upsertBoardSet(
    buildBoardSetInput(setId, rootBoard, rootBoardId, file.name),
  );
  await putBoards(setId, buildBoardRecords(boards, boardPathToId));

  const assetRecords = buildAssetRecords(resources);
  if (assetRecords.length > 0) {
    await putAssets(setId, assetRecords);
  }

  return { setId, boardId: rootBoardId };
}

function buildBoardPathIndex(manifest: OBFManifest): Map<string, string> {
  return new Map(
    Object.entries(manifest.paths.boards).map(([id, path]) => [path, id]),
  );
}

function resolveRootBoardId(
  manifest: OBFManifest,
  boardPathToId: Map<string, string>,
): string {
  const fromManifest = boardPathToId.get(manifest.root);
  if (fromManifest) {
    return fromManifest;
  }

  throw new Error(
    `Manifest root "${manifest.root}" does not match any board in manifest.paths.boards`,
  );
}

function buildBoardRecords(
  boards: Map<string, OBFBoard>,
  boardPathToId: Map<string, string>,
): UpsertBoardInput[] {
  return Array.from(boards.entries()).map(([id, board]) => ({
    boardId: id,
    name: board.name ?? id,
    obf: resolveLoadBoardPaths(board, boardPathToId),
  }));
}

function buildAssetRecords(
  resources: Map<string, Uint8Array>,
): UpsertAssetInput[] {
  return Array.from(resources.entries())
    .filter(([path]) => !path.endsWith(".obf") && path !== "manifest.json")
    .map(([path, buffer]) => {
      const mimeType = lookup(path) ?? "application/octet-stream";

      return {
        path,
        mime: mimeType,
        blob: new Blob([buffer.buffer as ArrayBuffer], { type: mimeType }),
      };
    });
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
      ? htmlToText(board.description_html)
      : undefined,
    license: board?.license?.type,
    locale: board?.locale ? normalizeLocale(board.locale) : undefined,
    gridRows: board?.grid.rows,
    gridColumns: board?.grid.columns,
  };
}

async function importOBFFile(file: File, setId: string): Promise<ImportResult> {
  const board = await loadOBF(file);

  await upsertBoardSet(buildBoardSetInput(setId, board, board.id, file.name));

  await putBoards(setId, [
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
