import { htmlToText } from "@shared/utils/html";
import { normalizeLocale } from "@shared/utils/locale";
import { randomId } from "@shared/utils/random-id";
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
  BoardsDB,
  UpsertAssetInput,
  UpsertBoardInput,
  UpsertBoardSetInput,
} from "../storage/db";
import {
  listBoardSets,
  putAssets,
  putBoards,
  upsertBoardSet,
  withBoardsDB,
} from "../storage/db";

export interface ImportResult {
  setId: string;
  boardId: string;
}

export async function importBoardFiles(
  files: File | File[],
): Promise<ImportResult[]> {
  const results = await writeBoardSetFiles(files);
  await notifyBoardSetsChanged();

  return results;
}

export async function writeBoardSetFiles(
  files: File | File[],
): Promise<ImportResult[]> {
  const fileList = Array.isArray(files) ? files : [files];

  return withBoardsDB(async (db) => {
    // A board set's identity is a fresh random id, so re-importing never
    // silently overwrites an unrelated set. Names can still collide, so we
    // disambiguate display names against existing sets and earlier files in
    // this batch (e.g. "Core" → "Core (2)").
    const takenNames = new Set(
      (await listBoardSets(db)).map((set) => set.name),
    );
    const results: ImportResult[] = [];

    for (const file of fileList) {
      if (file.name.toLowerCase().endsWith(".obz")) {
        results.push(await importOBZFile(db, file, takenNames));
      } else {
        results.push(await importOBFFile(db, file, takenNames));
      }
    }

    return results;
  });
}

function reserveUniqueName(base: string, takenNames: Set<string>): string {
  let name = base;
  for (let suffix = 2; takenNames.has(name); suffix++) {
    name = `${base} (${suffix})`;
  }

  takenNames.add(name);

  return name;
}

async function importOBZFile(
  db: BoardsDB,
  file: File,
  takenNames: Set<string>,
): Promise<ImportResult> {
  const setId = randomId();
  const { manifest, boards, resources } = await loadOBZ(file);
  const boardPathToId = buildBoardPathIndex(manifest);

  const rootBoardId = resolveRootBoardId(manifest, boardPathToId);
  const rootBoard = boards.get(rootBoardId);

  const boardRecords = buildBoardRecords(boards, boardPathToId);
  const assetRecords = buildAssetRecords(resources);
  const name = reserveUniqueName(rootBoard?.name ?? file.name, takenNames);

  // Write the boardSet record last: listBoardSets reads only that store, so a
  // failure mid-import leaves nothing visible rather than a board whose
  // pictograms never landed.
  if (assetRecords.length > 0) {
    await putAssets(db, setId, assetRecords);
  }
  await putBoards(db, setId, boardRecords);
  await upsertBoardSet(
    db,
    buildBoardSetInput(
      setId,
      rootBoard,
      rootBoardId,
      name,
      boardRecords.length,
    ),
  );

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
  name: string,
  boardCount: number,
): UpsertBoardSetInput {
  return {
    setId,
    name,
    rootBoardId,
    boardCount,
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

async function importOBFFile(
  db: BoardsDB,
  file: File,
  takenNames: Set<string>,
): Promise<ImportResult> {
  const setId = randomId();
  const board = await loadOBF(file);
  const name = reserveUniqueName(board.name ?? file.name, takenNames);

  // boardSet record written last; see importOBZFile.
  await putBoards(db, setId, [
    {
      boardId: board.id,
      name: board.name ?? board.id,
      obf: board,
    },
  ]);
  await upsertBoardSet(db, buildBoardSetInput(setId, board, board.id, name, 1));

  return { setId, boardId: board.id };
}
