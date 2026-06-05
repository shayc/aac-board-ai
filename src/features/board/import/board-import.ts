import { htmlToText } from "@shared/utils/html";
import { normalizeLocale } from "@shared/utils/locale";
import {
  loadBoard,
  type OBFBoard,
  type OBFManifest,
  type ParsedOBZ,
} from "@shayc/open-board-format";
import { lookup } from "mrmime";
import { notifyBoardSetsChanged } from "../storage/board-sets-store";
import type {
  UpsertAssetInput,
  UpsertBoardInput,
  UpsertBoardSetInput,
} from "../storage/boards-db";
import { putAssets, putBoards, upsertBoardSet } from "../storage/boards-db";

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
    const loaded = await loadBoard(file);

    results.push(
      loaded.format === "obz"
        ? await importOBZArchive(loaded.archive, setId, file.name)
        : await importOBFBoard(loaded.board, setId, file.name),
    );
  }

  return results;
}

async function importOBZArchive(
  archive: ParsedOBZ,
  setId: string,
  fileName: string,
): Promise<ImportResult> {
  const { manifest, boards, resources } = archive;
  const boardPathToId = buildBoardPathIndex(manifest);

  const rootBoardId = resolveRootBoardId(manifest, boardPathToId);
  const rootBoard = boards.get(rootBoardId);

  await upsertBoardSet(
    buildBoardSetInput(setId, rootBoard, rootBoardId, fileName),
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

export function resolveLoadBoardPaths(
  obfBoard: OBFBoard,
  boardPathToId: Map<string, string>,
): OBFBoard {
  const buttons = obfBoard.buttons.map((obfButton) => {
    if (!obfButton.load_board?.path || obfButton.load_board.id) {
      return obfButton;
    }

    const targetBoardId = boardPathToId.get(obfButton.load_board.path);
    if (!targetBoardId) {
      return obfButton;
    }

    return {
      ...obfButton,
      load_board: { ...obfButton.load_board, id: targetBoardId },
    };
  });

  return { ...obfBoard, buttons };
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
    rootBoardId,
    name: board?.name ?? fallbackSetName,
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

async function importOBFBoard(
  board: OBFBoard,
  setId: string,
  fileName: string,
): Promise<ImportResult> {
  await upsertBoardSet(buildBoardSetInput(setId, board, board.id, fileName));

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
  return filename.replace(/\.(obz|obf|zip|json)$/i, "").toLowerCase();
}
