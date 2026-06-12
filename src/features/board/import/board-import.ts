import { htmlToText } from "@shared/utils/html";
import { normalizeLocale } from "@shared/utils/locale";
import {
  loadBoard,
  type OBFBoard,
  type OBFManifest,
  type ParsedOBZ,
} from "@shayc/open-board-format";
import { lookup } from "mrmime";
import { notifyBoardSetsChanged } from "../board-sets/board-sets-store";
import type {
  UpsertAssetInput,
  UpsertBoardInput,
  UpsertBoardSetInput,
} from "../storage/boards-db";
import { putAssets, putBoards, upsertBoardSet } from "../storage/boards-db";

export interface ImportResult {
  setId: string;
  rootBoardId: string;
}

export async function importBoardFiles(
  files: File | File[],
): Promise<ImportResult[]> {
  const fileList = Array.isArray(files) ? files : [files];
  const results: ImportResult[] = [];

  for (const file of fileList) {
    const setId = deriveSetId(file.name);
    const loaded = await loadBoard(file);

    results.push(
      loaded.format === "obz"
        ? await importOBZArchive(loaded.archive, setId, file.name)
        : await importOBFBoard(loaded.board, setId, file.name),
    );
  }

  await notifyBoardSetsChanged();

  return results;
}

async function importOBZArchive(
  archive: ParsedOBZ,
  setId: string,
  fileName: string,
): Promise<ImportResult> {
  const { manifest, boards, rootBoard, resources } = archive;
  const boardPathToId = buildBoardPathToId(manifest);

  await upsertBoardSet(buildBoardSetInput(setId, rootBoard, fileName));
  await putBoards(setId, buildBoardInputs(boards, boardPathToId));

  const assetInputs = buildAssetInputs(resources);
  if (assetInputs.length > 0) {
    await putAssets(setId, assetInputs);
  }

  return { setId, rootBoardId: rootBoard.id };
}

async function importOBFBoard(
  board: OBFBoard,
  setId: string,
  fileName: string,
): Promise<ImportResult> {
  await upsertBoardSet(buildBoardSetInput(setId, board, fileName));

  await putBoards(setId, [
    {
      boardId: board.id,
      name: board.name ?? board.id,
      obf: board,
    },
  ]);

  return { setId, rootBoardId: board.id };
}

function buildBoardPathToId(manifest: OBFManifest): Map<string, string> {
  return new Map(
    Object.entries(manifest.paths.boards).map(([id, path]) => [path, id]),
  );
}

export function resolveLoadBoardPaths(
  board: OBFBoard,
  boardPathToId: Map<string, string>,
): OBFBoard {
  const buttons = board.buttons.map((button) => {
    if (!button.load_board?.path || button.load_board.id) {
      return button;
    }

    const targetBoardId = boardPathToId.get(button.load_board.path);
    if (!targetBoardId) {
      return button;
    }

    return {
      ...button,
      load_board: { ...button.load_board, id: targetBoardId },
    };
  });

  return { ...board, buttons };
}

function buildBoardInputs(
  boards: Map<string, OBFBoard>,
  boardPathToId: Map<string, string>,
): UpsertBoardInput[] {
  return Array.from(boards.entries()).map(([id, board]) => ({
    boardId: id,
    name: board.name ?? id,
    obf: resolveLoadBoardPaths(board, boardPathToId),
  }));
}

function buildAssetInputs(
  resources: Map<string, Uint8Array>,
): UpsertAssetInput[] {
  return Array.from(resources.entries())
    .filter(([path]) => !path.endsWith(".obf") && path !== "manifest.json")
    .map(([path, buffer]) => {
      const mimeType = lookup(path) ?? "application/octet-stream";

      return {
        path,
        mime: mimeType,
        blob: new Blob([buffer as Uint8Array<ArrayBuffer>], { type: mimeType }),
      };
    });
}

function buildBoardSetInput(
  setId: string,
  board: OBFBoard,
  fallbackSetName: string,
): UpsertBoardSetInput {
  return {
    setId,
    name: board.name ?? fallbackSetName,
    rootBoardId: board.id,
    author: board.license?.author_name,
    description: board.description_html
      ? htmlToText(board.description_html)
      : undefined,
    license: board.license?.type,
    locale: board.locale ? normalizeLocale(board.locale) : undefined,
    gridRows: board.grid.rows,
    gridColumns: board.grid.columns,
  };
}

function deriveSetId(filename: string): string {
  const stem = filename.replace(/\.(obz|obf|zip|json)$/i, "").toLowerCase();

  return stem.slice(0, 255) || "imported-board";
}
