import {
  loadBoard,
  type LoadedBoard,
  type UnzipLimits,
} from "@shayc/open-board-format";
import { lookup } from "mrmime";
import { createBoardSet } from "../board-sets/board-sets-store";
import { obfToBoardSetMetadata } from "../obf/obf-to-board-set-metadata";
import {
  type AssetInput,
  BoardSetAlreadyExistsError,
  type BoardSetInput,
  MAX_ID_LENGTH,
} from "../storage/board-set-storage";
import { stripBoardFileExtension } from "./board-file-formats";

export interface ImportedBoardSet {
  id: string;
  rootBoardId: string;
}

export interface ImportFailure {
  fileName: string;
  error: unknown;
}

export interface ImportOutcome {
  importedBoardSets: ImportedBoardSet[];
  failures: ImportFailure[];
}

type BoardSetContent = Omit<BoardSetInput, "id">;

/**
 * Checked against archive metadata before each entry is decompressed.
 * Allows observed board sets up to ~70 MB while bounding allocation.
 */
export const BOARD_FILE_IMPORT_LIMITS: UnzipLimits = {
  maxTotalOriginalSize: 500 * 1024 * 1024,
  maxEntrySize: 100 * 1024 * 1024,
  maxEntries: 5000,
};

export async function importEachBoardFile(
  files: readonly File[],
): Promise<ImportOutcome> {
  const importedBoardSets: ImportedBoardSet[] = [];
  const failures: ImportFailure[] = [];

  for (const file of files) {
    try {
      importedBoardSets.push(await importBoardFile(file));
    } catch (error) {
      failures.push({ fileName: file.name, error });
    }
  }

  return { importedBoardSets, failures };
}

export async function importBoardFile(file: File): Promise<ImportedBoardSet> {
  const loadedBoard = await loadBoard(file, {
    limits: BOARD_FILE_IMPORT_LIMITS,
  });
  const baseId = deriveBoardSetId(file.name);
  // A file named only by its extension has no stem to name the set after.
  const fallbackName = stripBoardFileExtension(file.name) || baseId;
  const content = buildBoardSetContent(loadedBoard, fallbackName);

  for (let candidateNumber = 1; ; candidateNumber += 1) {
    const id = buildBoardSetIdCandidate(baseId, candidateNumber);

    try {
      await createBoardSet({ ...content, id });

      return { id, rootBoardId: content.rootBoardId };
    } catch (error) {
      if (!(error instanceof BoardSetAlreadyExistsError)) {
        throw error;
      }
    }
  }
}

function buildBoardSetContent(
  loadedBoard: LoadedBoard,
  fallbackName: string,
): BoardSetContent {
  if (loadedBoard.format === "obf") {
    const { board } = loadedBoard;

    return {
      ...obfToBoardSetMetadata(board, fallbackName),
      rootBoardId: board.id,
      boards: [board],
      assets: [],
    };
  }

  const { boards, rootBoard, resources } = loadedBoard.archive;

  return {
    ...obfToBoardSetMetadata(rootBoard, fallbackName),
    rootBoardId: rootBoard.id,
    boards: [...boards.values()],
    assets: buildAssetInputs(resources),
  };
}

export function buildAssetInputs(
  resources: Map<string, Uint8Array<ArrayBuffer>>,
): AssetInput[] {
  return Array.from(resources)
    .filter(([path]) => {
      const lowerPath = path.toLowerCase();

      return !lowerPath.endsWith(".obf") && lowerPath !== "manifest.json";
    })
    .map(([path, bytes]) => ({
      path,
      bytes,
      type: lookup(path) ?? "application/octet-stream",
    }));
}

export function deriveBoardSetId(fileName: string): string {
  const stem = stripBoardFileExtension(fileName).toLowerCase();

  return stem.slice(0, MAX_ID_LENGTH) || "imported-board";
}

function buildBoardSetIdCandidate(baseId: string, candidateNumber: number) {
  if (candidateNumber === 1) {
    return baseId;
  }

  const suffix = `-${candidateNumber}`;

  return `${baseId.slice(0, MAX_ID_LENGTH - suffix.length)}${suffix}`;
}
