import type { OBFBoard } from "@shayc/open-board-format";
import { obfToBoard } from "../obf/obf-to-board";
import type { Board, BoardKey } from "../board-types";
import { getAssetURL } from "./asset-urls";
import { BoardNotFoundError, getBoardRecord } from "./board-content-storage";

export async function loadStoredBoard(
  key: BoardKey,
  signal?: AbortSignal,
): Promise<Board> {
  const obfBoard = await readOBFBoard(key);

  signal?.throwIfAborted();

  const assetURLByPath = await resolveAssetURLs(key.boardSetId, obfBoard);

  signal?.throwIfAborted();

  return obfToBoard(obfBoard, assetURLByPath);
}

async function readOBFBoard(key: BoardKey): Promise<OBFBoard> {
  const record = await getBoardRecord(key);
  if (!record) {
    throw new BoardNotFoundError(key);
  }

  return record.obf;
}

async function resolveAssetURLs(
  boardSetId: string,
  obfBoard: OBFBoard,
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    Array.from(listMediaPaths(obfBoard), async (path) => {
      const url = await getAssetURL(boardSetId, path).catch(() => undefined);

      return url ? [[path, url] as const] : [];
    }),
  );

  return new Map(entries.flat());
}

function listMediaPaths(obfBoard: OBFBoard): Set<string> {
  const media = [...(obfBoard.images ?? []), ...(obfBoard.sounds ?? [])];

  return new Set(media.flatMap((item) => (item.path ? [item.path] : [])));
}
