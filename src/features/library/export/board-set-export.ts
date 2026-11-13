import { saveFile } from "@shared/utils/save-file";
import { createOBZ, type OBFBoard } from "@shayc/open-board-format";
import { collectMediaPaths } from "../obf/collect-media-paths";
import {
  getAssetBlob,
  listBoardRecords,
} from "../storage/board-content-storage";
import type { BoardSetRecord } from "../storage/board-set-storage";
import { normalizeAssetPath } from "../storage/normalize-asset-path";

export async function exportBoardSet(
  boardSet: Pick<BoardSetRecord, "id" | "name" | "rootBoardId">,
): Promise<void> {
  const archive = await boardSetToOBZ(boardSet);
  // Safari appends ".zip" to a download typed as a ZIP archive, and import
  // accepts only board file extensions.
  const file = new Blob([archive], { type: "application/octet-stream" });

  saveFile(file, `${boardSet.name}.obz`);
}

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
  const assetPaths = new Set(
    Array.from(collectMediaPaths(boards), normalizeAssetPath).filter(
      (path) => path !== "",
    ),
  );
  const assets = new Map<string, Uint8Array>();

  for (const path of assetPaths) {
    const blob = await getAssetBlob(boardSetId, path);
    if (blob) {
      assets.set(path, await blob.bytes());
    }
  }

  return assets;
}

/**
 * Archive paths must match stored entry names. Clear missing paths to allow
 * consumers to fall back to embedded media or remote URLs.
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
