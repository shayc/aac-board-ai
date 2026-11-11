import { createOBZ, type OBFBoard } from "@shayc/open-board-format";
import { saveFile } from "@shared/utils/save-file";
import {
  getAssetBlob,
  listBoardRecords,
} from "../storage/board-content-storage";
import type { BoardSetRecord } from "../storage/board-set-storage";

type BoardSetToExport = Pick<BoardSetRecord, "id" | "name" | "rootBoardId">;

export async function exportBoardSet(
  boardSet: BoardSetToExport,
): Promise<void> {
  const archive = await boardSetToOBZ(boardSet);

  saveFile(archive, `${boardSet.name}.obz`);
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
  const resources = await loadMediaResources(
    id,
    records.map((record) => record.obf),
  );

  const boards = records.map((record) =>
    withPackagedPaths(record.obf, boardIds, resources),
  );

  return createOBZ(boards, rootBoardId, resources);
}

async function loadMediaResources(
  boardSetId: string,
  boards: readonly OBFBoard[],
): Promise<Map<string, Uint8Array>> {
  const resources = new Map<string, Uint8Array>();

  for (const path of collectMediaPaths(boards)) {
    const blob = await getAssetBlob(boardSetId, path);
    if (blob) {
      resources.set(path, await blob.bytes());
    }
  }

  return resources;
}

function collectMediaPaths(boards: readonly OBFBoard[]): Set<string> {
  const paths = new Set<string>();

  for (const board of boards) {
    for (const media of [...(board.images ?? []), ...(board.sounds ?? [])]) {
      if (media.path) {
        paths.add(media.path);
      }
    }
  }

  return paths;
}

/**
 * Points board links at where `createOBZ` writes each board, since the paths
 * kept from the imported archive no longer exist. Media whose file was never
 * stored drop their path, falling back to `data` or `url` as the app does.
 */
function withPackagedPaths(
  board: OBFBoard,
  boardIds: ReadonlySet<string>,
  resources: ReadonlyMap<string, Uint8Array>,
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

  return {
    ...board,
    buttons,
    images: board.images?.map((image) => withStoredPath(image, resources)),
    sounds: board.sounds?.map((sound) => withStoredPath(sound, resources)),
  };
}

// Must match the layout `createOBZ` writes; the export round-trip test guards it.
function packagedBoardPath(boardId: string): string {
  return `boards/${encodeURIComponent(boardId)}.obf`;
}

function withStoredPath<Media extends { path?: string }>(
  media: Media,
  resources: ReadonlyMap<string, Uint8Array>,
): Media {
  if (!media.path || resources.has(media.path)) {
    return media;
  }

  return { ...media, path: undefined };
}
