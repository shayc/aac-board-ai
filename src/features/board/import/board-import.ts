import {
  loadBoard,
  type OBFBoard,
  type OBFManifest,
  type ParsedOBZ,
  type UnzipLimits,
} from "@shayc/open-board-format";
import { lookup } from "mrmime";
import {
  BoardSetAlreadyExistsError,
  createBoardSet,
  type AssetInput,
} from "../board-sets/board-sets-store";

export interface BoardSetImportResult {
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
): Promise<BoardSetImportResult[]> {
  const fileList = Array.isArray(files) ? files : [files];
  const results: BoardSetImportResult[] = [];

  for (const file of fileList) {
    results.push(await importBoardFile(file));
  }

  return results;
}

async function importBoardFile(file: File): Promise<BoardSetImportResult> {
  const loaded = await loadBoard(file, { limits: BOARD_IMPORT_LIMITS });
  const baseSetId = deriveSetId(file.name);

  for (let candidateNumber = 1; ; candidateNumber += 1) {
    const setId = buildSetIdCandidate(baseSetId, candidateNumber);

    try {
      return loaded.format === "obz"
        ? await importOBZArchive(loaded.archive, setId, file.name)
        : await importOBFBoard(loaded.board, setId, file.name);
    } catch (error) {
      if (!(error instanceof BoardSetAlreadyExistsError)) {
        throw error;
      }
    }
  }
}

async function importOBZArchive(
  archive: ParsedOBZ,
  setId: string,
  fileName: string,
): Promise<BoardSetImportResult> {
  const { manifest, boards, rootBoard, resources } = archive;
  const boardPathToId = buildBoardPathToId(manifest);

  await createBoardSet({
    id: setId,
    rootBoardId: rootBoard.id,
    name: rootBoard.name ?? fileName,
    boards: Array.from(boards.values(), (board) =>
      resolveLoadBoardPaths(board, boardPathToId),
    ),
    assets: buildAssetInputs(resources),
  });

  return { id: setId, rootBoardId: rootBoard.id };
}

async function importOBFBoard(
  board: OBFBoard,
  setId: string,
  fileName: string,
): Promise<BoardSetImportResult> {
  await createBoardSet({
    id: setId,
    rootBoardId: board.id,
    name: board.name ?? fileName,
    boards: [board],
    assets: [],
  });

  return { id: setId, rootBoardId: board.id };
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

function deriveSetId(fileName: string): string {
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
