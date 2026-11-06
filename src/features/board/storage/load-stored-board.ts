import type { OBFBoard } from "@shayc/open-board-format";
import { obfToBoard } from "../obf/obf-to-board";
import type { Board } from "../board-types";
import { getAssetURL } from "./asset-urls";
import { BoardNotFoundError, getBoardRecord } from "./board-content-storage";

export async function loadStoredBoard(
  boardSetId: string,
  boardId: string,
  signal?: AbortSignal,
): Promise<Board> {
  const obfBoard = await readOBFBoard(boardSetId, boardId);

  signal?.throwIfAborted();

  const assetURLByPath = await resolveAssetURLs(boardSetId, obfBoard);

  signal?.throwIfAborted();

  return obfToBoard(obfBoard, assetURLByPath);
}

async function readOBFBoard(
  boardSetId: string,
  boardId: string,
): Promise<OBFBoard> {
  const record = await getBoardRecord(boardSetId, boardId);
  if (!record) {
    throw new BoardNotFoundError(boardSetId, boardId);
  }

  return record.obf;
}

async function resolveAssetURLs(
  boardSetId: string,
  obfBoard: OBFBoard,
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    Array.from(listMediaPaths(obfBoard), async (path) => {
      const url = await findAssetURL(boardSetId, path);

      return url ? [[path, url] as const] : [];
    }),
  );

  return new Map(entries.flat());
}

function listMediaPaths(obfBoard: OBFBoard): Set<string> {
  const media = [...(obfBoard.images ?? []), ...(obfBoard.sounds ?? [])];

  return new Set(media.flatMap((item) => (item.path ? [item.path] : [])));
}

async function findAssetURL(
  boardSetId: string,
  path: string,
): Promise<string | undefined> {
  try {
    return await getAssetURL(boardSetId, path);
  } catch {
    return undefined;
  }
}
