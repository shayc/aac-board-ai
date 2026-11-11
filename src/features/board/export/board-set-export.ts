import { createOBZ, type OBFBoard } from "@shayc/open-board-format";
import { saveFile } from "@shared/utils/save-file";
import {
  getAssetBlob,
  listBoardRecords,
  normalizeAssetPath,
} from "../storage/board-content-storage";
import type { BoardSetRecord } from "../storage/board-set-storage";

export async function exportBoardSet(
  boardSet: Pick<BoardSetRecord, "id" | "name" | "rootBoardId">,
): Promise<void> {
  const archive = await boardSetToOBZ(boardSet);
  // Safari appends ".zip" to a download typed as a ZIP archive, and import
  // accepts only board file extensions.
  const file = new Blob([archive], { type: "application/octet-stream" });

  saveFile(file, `${boardSet.name}.obz`);
}

/**
 * Packages a stored board set with its assets and the translations saved on
 * this device, which live in each board's `strings`.
 */
export async function boardSetToOBZ({
  id,
  rootBoardId,
}: Pick<BoardSetRecord, "id" | "rootBoardId">): Promise<Blob> {
  const records = await listBoardRecords(id);
  const boardIds = new Set(records.map((record) => record.id));
  const assets = await loadStoredAssets(
    id,
    records.map((record) => record.obf),
  );

  const boards = records.map((record) =>
    withPackagedMedia(withPackagedLinks(record.obf, boardIds), assets),
  );

  return createOBZ(boards, rootBoardId, assets);
}

/** Stored assets by the normalized path they are stored and packaged under. */
async function loadStoredAssets(
  boardSetId: string,
  boards: readonly OBFBoard[],
): Promise<Map<string, Uint8Array>> {
  const assets = new Map<string, Uint8Array>();

  for (const path of collectAssetPaths(boards)) {
    const blob = await getAssetBlob(boardSetId, path);
    if (blob) {
      assets.set(path, await blob.bytes());
    }
  }

  return assets;
}

function collectAssetPaths(boards: readonly OBFBoard[]): Set<string> {
  const paths = new Set<string>();

  for (const board of boards) {
    for (const media of [...(board.images ?? []), ...(board.sounds ?? [])]) {
      if (media.path) {
        paths.add(normalizeAssetPath(media.path));
      }
    }
  }

  return paths;
}

/**
 * Points board links at where `createOBZ` writes each board, since the paths
 * kept from the imported archive no longer exist.
 */
function withPackagedLinks(
  board: OBFBoard,
  boardIds: ReadonlySet<string>,
): OBFBoard {
  const buttons = board.buttons.map((button) => {
    const targetBoardId = button.load_board?.id;
    if (!targetBoardId || !boardIds.has(targetBoardId)) {
      return button;
    }

    return {
      ...button,
      load_board: {
        ...button.load_board,
        path: packagedBoardPath(targetBoardId),
      },
    };
  });

  return { ...board, buttons };
}

// Must match the layout `createOBZ` writes; the export round-trip test guards it.
function packagedBoardPath(boardId: string): string {
  return `boards/${encodeURIComponent(boardId)}.obf`;
}

/**
 * Points media at the normalized path their file is packaged under, because a
 * path such as `/images/a.png` is not a portable archive entry. Media whose
 * file was never stored lose their path, falling back to `data` or `url` as
 * the app does.
 */
function withPackagedMedia(
  board: OBFBoard,
  assets: ReadonlyMap<string, Uint8Array>,
): OBFBoard {
  function atPackagedPath<Media extends { path?: string }>(
    media: Media,
  ): Media {
    if (!media.path) {
      return media;
    }

    const path = normalizeAssetPath(media.path);

    return { ...media, path: assets.has(path) ? path : undefined };
  }

  return {
    ...board,
    images: board.images?.map(atPackagedPath),
    sounds: board.sounds?.map(atPackagedPath),
  };
}
