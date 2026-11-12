import {
  loadBoard,
  type LoadedBoard,
  type UnzipLimits,
} from "@shayc/open-board-format";
import { lookup } from "mrmime";
import { createBoardSet } from "../board-sets/board-sets-store";
import { nonBlankText } from "../non-blank-text";
import {
  BoardSetAlreadyExistsError,
  MAX_ID_LENGTH,
  type AssetInput,
  type BoardSetInput,
} from "../storage/board-set-storage";
import { stripBoardFileExtension } from "./board-file-formats";

export interface ImportedBoardSet {
  id: string;
  rootBoardId: string;
}

export interface BoardFileImportFailure {
  fileName: string;
  error: unknown;
}

export interface BoardFilesImportOutcome {
  importedBoardSets: ImportedBoardSet[];
  failures: BoardFileImportFailure[];
}

type BoardSetContent = Omit<BoardSetInput, "id">;

/**
 * Checked against archive metadata before each entry is decompressed.
 * Allows observed board sets up to ~70 MB while bounding allocation.
 */
export const BOARD_IMPORT_LIMITS: UnzipLimits = {
  maxTotalOriginalSize: 500 * 1024 * 1024,
  maxEntrySize: 100 * 1024 * 1024,
  maxEntries: 5000,
};

export async function importEachBoardFile(
  files: readonly File[],
): Promise<BoardFilesImportOutcome> {
  const importedBoardSets: ImportedBoardSet[] = [];
  const failures: BoardFileImportFailure[] = [];

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
  const loadedBoard = await loadBoard(file, { limits: BOARD_IMPORT_LIMITS });
  const content = buildBoardSetContent(loadedBoard, file.name);
  const baseBoardSetId = deriveBoardSetId(file.name);

  for (let candidateNumber = 1; ; candidateNumber += 1) {
    const id = buildBoardSetIdCandidate(baseBoardSetId, candidateNumber);

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
  fileName: string,
): BoardSetContent {
  if (loadedBoard.format === "obf") {
    const { board } = loadedBoard;

    return {
      rootBoardId: board.id,
      name: nonBlankText(board.name) ?? fileName,
      boards: [board],
      assets: [],
    };
  }

  const { boards, rootBoard, resources } = loadedBoard.archive;

  return {
    rootBoardId: rootBoard.id,
    name: nonBlankText(rootBoard.name) ?? fileName,
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
    .map(([path, buffer]) => {
      const mimeType = lookup(path) ?? "application/octet-stream";

      return {
        path,
        blob: new Blob([buffer], { type: mimeType }),
      };
    });
}

export function deriveBoardSetId(fileName: string): string {
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
