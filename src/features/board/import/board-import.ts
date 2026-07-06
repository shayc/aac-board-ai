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
import {
  createBoardSet,
  findBoardSetBySourceHash,
  type AssetInput,
  type BoardInput,
  type BoardSetInput,
} from "../storage/boards-db";
import {
  BOARD_UNZIP_LIMITS,
  BoardFileTooLargeError,
  MAX_BOARD_FILE_BYTES,
} from "./import-limits";

export interface ImportResult {
  setId: string;
  rootBoardId: string;
  alreadyExisted: boolean;
}

async function hashFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function importBoardSets(
  files: File | File[],
): Promise<ImportResult[]> {
  const fileList = Array.isArray(files) ? files : [files];
  const results: ImportResult[] = [];
  const importedInBatch = new Map<string, ImportResult>();

  try {
    for (const file of fileList) {
      if (file.size > MAX_BOARD_FILE_BYTES) {
        throw new BoardFileTooLargeError();
      }

      const sourceHash = await hashFile(file);
      const batchHit = importedInBatch.get(sourceHash);

      if (batchHit) {
        results.push({ ...batchHit, alreadyExisted: true });
        continue;
      }

      const existing = await findBoardSetBySourceHash(sourceHash);

      if (existing) {
        const result: ImportResult = {
          setId: existing.setId,
          rootBoardId: existing.rootBoardId,
          alreadyExisted: true,
        };
        results.push(result);
        importedInBatch.set(sourceHash, result);
        continue;
      }

      const setId = crypto.randomUUID();
      const loaded = await loadBoard(file, { limits: BOARD_UNZIP_LIMITS });

      const result =
        loaded.format === "obz"
          ? await importOBZArchive(loaded.archive, setId, file.name, sourceHash)
          : await importOBFBoard(loaded.board, setId, file.name, sourceHash);

      results.push(result);
      importedInBatch.set(sourceHash, result);
    }
  } finally {
    if (results.some((result) => !result.alreadyExisted)) {
      await notifyBoardSetsChanged();
    }
  }

  return results;
}

async function importOBZArchive(
  archive: ParsedOBZ,
  setId: string,
  fileName: string,
  sourceHash: string,
): Promise<ImportResult> {
  const { manifest, boards, rootBoard, resources } = archive;
  const boardPathToId = buildBoardPathToId(manifest);

  await createBoardSet({
    boardSet: { ...buildBoardSetInput(setId, rootBoard, fileName), sourceHash },
    boards: buildBoardInputs(boards, boardPathToId),
    assets: buildAssetInputs(resources),
  });

  return { setId, rootBoardId: rootBoard.id, alreadyExisted: false };
}

async function importOBFBoard(
  board: OBFBoard,
  setId: string,
  fileName: string,
  sourceHash: string,
): Promise<ImportResult> {
  await createBoardSet({
    boardSet: { ...buildBoardSetInput(setId, board, fileName), sourceHash },
    boards: [{ boardId: board.id, name: board.name ?? board.id, obf: board }],
    assets: [],
  });

  return { setId, rootBoardId: board.id, alreadyExisted: false };
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
