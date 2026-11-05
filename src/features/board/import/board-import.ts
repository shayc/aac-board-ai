import {
  loadBoard,
  type OBFBoard,
  type OBFManifest,
  type ParsedOBZ,
  type UnzipLimits,
} from "@shayc/open-board-format";
import { lookup } from "mrmime";
import { createBoardSet } from "../board-sets/board-sets-store";
import { nonBlankText } from "../non-blank-text";
import {
  BoardSetAlreadyExistsError,
  MAX_ID_LENGTH,
  type AssetInput,
} from "../storage/board-set-storage";
import { stripBoardFileExtension } from "./board-file-formats";

export interface ImportedBoardSet {
  id: string;
  rootBoardId: string;
}

/**
 * Decompression caps used by every OBZ import path. Limits are checked against
 * each entry's declared metadata before that entry is inflated; entries
 * accepted earlier may already be allocated. The values are generous relative
 * to observed boards (~70 MB) while bounding decompression allocation.
 * Exceeding a cap makes `loadBoard` throw an `OBFError` with code
 * `"archive-too-large"`.
 */
export const BOARD_IMPORT_LIMITS: UnzipLimits = {
  maxTotalOriginalSize: 500 * 1024 * 1024,
  maxEntrySize: 100 * 1024 * 1024,
  maxEntries: 5000,
};

export async function importBoardSets(
  files: File | File[],
): Promise<ImportedBoardSet[]> {
  const fileList = Array.isArray(files) ? files : [files];
  const importedBoardSets: ImportedBoardSet[] = [];

  for (const file of fileList) {
    importedBoardSets.push(await importBoardFile(file));
  }

  return importedBoardSets;
}

async function importBoardFile(file: File): Promise<ImportedBoardSet> {
  const loaded = await loadBoard(file, { limits: BOARD_IMPORT_LIMITS });
  const baseBoardSetId = deriveBoardSetId(file.name);

  for (let candidateNumber = 1; ; candidateNumber += 1) {
    const boardSetId = buildBoardSetIdCandidate(
      baseBoardSetId,
      candidateNumber,
    );

    try {
      return loaded.format === "obz"
        ? await importOBZArchive(loaded.archive, boardSetId, file.name)
        : await importOBFBoard(loaded.board, boardSetId, file.name);
    } catch (error) {
      if (!(error instanceof BoardSetAlreadyExistsError)) {
        throw error;
      }
    }
  }
}

async function importOBZArchive(
  archive: ParsedOBZ,
  boardSetId: string,
  fileName: string,
): Promise<ImportedBoardSet> {
  const { manifest, boards, rootBoard, resources } = archive;
  const boardIdByPath = buildBoardIdByPath(manifest);

  await createBoardSet({
    id: boardSetId,
    rootBoardId: rootBoard.id,
    name: nonBlankText(rootBoard.name) ?? fileName,
    boards: Array.from(boards.values(), (board) =>
      resolveBoardLinks(board, boardIdByPath),
    ),
    assets: buildAssetInputs(resources),
  });

  return { id: boardSetId, rootBoardId: rootBoard.id };
}

async function importOBFBoard(
  board: OBFBoard,
  boardSetId: string,
  fileName: string,
): Promise<ImportedBoardSet> {
  await createBoardSet({
    id: boardSetId,
    rootBoardId: board.id,
    name: nonBlankText(board.name) ?? fileName,
    boards: [board],
    assets: [],
  });

  return { id: boardSetId, rootBoardId: board.id };
}

function buildBoardIdByPath(manifest: OBFManifest): Map<string, string> {
  return new Map(
    Object.entries(manifest.paths.boards).map(([id, path]) => [path, id]),
  );
}

export function resolveBoardLinks(
  board: OBFBoard,
  boardIdByPath: Map<string, string>,
): OBFBoard {
  const buttons = board.buttons.map((button) => {
    if (!button.load_board?.path || button.load_board.id) {
      return button;
    }

    const targetBoardId = boardIdByPath.get(button.load_board.path);
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

function deriveBoardSetId(fileName: string): string {
  const stem = stripBoardFileExtension(fileName).toLowerCase();

  return stem.slice(0, MAX_ID_LENGTH) || "imported-board";
}

function buildBoardSetIdCandidate(
  baseBoardSetId: string,
  candidateNumber: number,
) {
  if (candidateNumber === 1) {
    return baseBoardSetId;
  }

  const suffix = `-${candidateNumber}`;

  return `${baseBoardSetId.slice(0, MAX_ID_LENGTH - suffix.length)}${suffix}`;
}
