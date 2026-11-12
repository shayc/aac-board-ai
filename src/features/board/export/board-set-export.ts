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
  const assets = await loadStoredAssets(
    id,
    records.map((record) => record.obf),
  );

  const boards = records.map((record) => withPackagedMedia(record.obf, assets));

  return createOBZ(boards, rootBoardId, assets);
}

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
