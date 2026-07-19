import { htmlToText } from "@shared/utils/html";
import { normalizeLocale } from "@shared/utils/locale";
import {
  loadBoard,
  type OBFBoard,
  type OBFManifest,
  type ParsedOBZ,
  type UnzipLimits,
} from "@shayc/open-board-format";
import { lookup } from "mrmime";
import { refreshAndBroadcastBoardSets } from "../board-sets/board-sets-store";
import type {
  AssetInput,
  BoardInput,
  BoardSetInput,
} from "../storage/boards-db";
import {
  BoardSetAlreadyExistsError,
  createBoardSet,
} from "../storage/boards-db";

export interface ImportResult {
  setId: string;
  rootBoardId: string;
}

/**
 * Decompression limits enforced against an OBZ archive's declared uncompressed
 * sizes before any entry is inflated — zip-bomb defense for every import path
 * (picker, drag-drop, file-handler, URL). The caps are deliberately generous
 * versus real boards (observed up to ~70MB) but bounded, so a maliciously
 * crafted archive is rejected before it can exhaust memory. Exceeding a cap
 * makes `loadBoard` throw an `OBFError` with code `"archive-too-large"`.
 */
export const BOARD_IMPORT_LIMITS: UnzipLimits = {
  maxTotalOriginalSize: 500 * 1024 * 1024,
  maxEntrySize: 100 * 1024 * 1024,
  maxEntries: 5000,
};

export async function importBoardSets(
  files: File | File[],
): Promise<ImportResult[]> {
  const fileList = Array.isArray(files) ? files : [files];
  const results: ImportResult[] = [];

  try {
    for (const file of fileList) {
      const loaded = await loadBoard(file, { limits: BOARD_IMPORT_LIMITS });
      const baseSetId = deriveSetId(file.name);

      for (let candidateNumber = 1; ; candidateNumber += 1) {
        const setId = buildSetIdCandidate(baseSetId, candidateNumber);

        try {
          results.push(
            loaded.format === "obz"
              ? await importOBZArchive(loaded.archive, setId, file.name)
              : await importOBFBoard(loaded.board, setId, file.name),
          );
          break;
        } catch (error) {
          if (!(error instanceof BoardSetAlreadyExistsError)) {
            throw error;
          }
        }
      }
    }
  } finally {
    if (results.length > 0) {
      await refreshAndBroadcastBoardSets();
    }
  }

  return results;
}

async function importOBZArchive(
  archive: ParsedOBZ,
  setId: string,
  fileName: string,
): Promise<ImportResult> {
  const { manifest, boards, rootBoard, resources } = archive;
  const boardPathToId = buildBoardPathToId(manifest);

  await createBoardSet({
    boardSet: buildBoardSetInput(setId, rootBoard, fileName),
    boards: buildBoardInputs(boards, boardPathToId),
    assets: buildAssetInputs(resources),
  });

  return { setId, rootBoardId: rootBoard.id };
}

async function importOBFBoard(
  board: OBFBoard,
  setId: string,
  fileName: string,
): Promise<ImportResult> {
  await createBoardSet({
    boardSet: buildBoardSetInput(setId, board, fileName),
    boards: [{ boardId: board.id, name: board.name ?? board.id, obf: board }],
    assets: [],
  });

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
): BoardInput[] {
  return Array.from(boards.entries()).map(([id, board]) => ({
    boardId: id,
    name: board.name ?? id,
    obf: resolveLoadBoardPaths(board, boardPathToId),
  }));
}

export function buildAssetInputs(
  resources: Map<string, Uint8Array>,
): AssetInput[] {
  return Array.from(resources.entries())
    .filter(([path]) => {
      const lowerPath = path.toLowerCase();
      return !lowerPath.endsWith(".obf") && lowerPath !== "manifest.json";
    })
    .map(([path, buffer]) => {
      const mimeType = lookup(path) ?? "application/octet-stream";

      return {
        path,
        blob: new Blob([buffer as Uint8Array<ArrayBuffer>], { type: mimeType }),
      };
    });
}

function buildBoardSetInput(
  setId: string,
  board: OBFBoard,
  fallbackSetName: string,
): BoardSetInput {
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

export function deriveSetId(fileName: string): string {
  const stem = fileName.replace(/\.(obz|obf|zip|json)$/i, "").toLowerCase();

  return stem.slice(0, 255) || "imported-board";
}

function buildSetIdCandidate(baseSetId: string, candidateNumber: number) {
  if (candidateNumber === 1) {
    return baseSetId;
  }

  const suffix = `-${candidateNumber}`;

  return `${baseSetId.slice(0, 255 - suffix.length)}${suffix}`;
}
