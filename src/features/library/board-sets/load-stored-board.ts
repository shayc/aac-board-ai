import type { OBFBoard } from "@shayc/open-board-format";
import type { Board, BoardKey } from "../board-types";
import { obfToBoard } from "../obf/obf-to-board";
import { getAssetURL } from "../storage/asset-urls";
import {
  BoardNotFoundError,
  getBoardRecord,
  hasBoardRecord,
} from "../storage/board-content-storage";

export async function loadStoredBoard(
  key: BoardKey,
  signal?: AbortSignal,
): Promise<Board> {
  const obfBoard = await readOBFBoard(key);
  signal?.throwIfAborted();

  const [assetURLByPath, storedBoardIds] = await Promise.all([
    resolveAssetURLs(key.boardSetId, obfBoard),
    findStoredLinkedBoardIds(key.boardSetId, obfBoard),
  ]);
  signal?.throwIfAborted();

  return keepStoredLinks(obfToBoard(obfBoard, assetURLByPath), storedBoardIds);
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
    Array.from(collectMediaPaths(obfBoard), async (path) => {
      const url = await getAssetURL(boardSetId, path).catch(() => undefined);

      return url ? [[path, url] as const] : [];
    }),
  );

  return new Map(entries.flat());
}

function collectMediaPaths(obfBoard: OBFBoard): Set<string> {
  const media = [...(obfBoard.images ?? []), ...(obfBoard.sounds ?? [])];

  return new Set(media.flatMap((item) => (item.path ? [item.path] : [])));
}

async function findStoredLinkedBoardIds(
  boardSetId: string,
  obfBoard: OBFBoard,
): Promise<Set<string>> {
  const entries = await Promise.all(
    Array.from(collectLinkedBoardIds(obfBoard), async (boardId) => {
      const isStored = await hasBoardRecord({ boardSetId, boardId });

      return isStored ? [boardId] : [];
    }),
  );

  return new Set(entries.flat());
}

function collectLinkedBoardIds(obfBoard: OBFBoard): Set<string> {
  return new Set(
    obfBoard.buttons.flatMap(({ load_board: link }) =>
      link?.id ? [link.id] : [],
    ),
  );
}

// A board file may link to boards it does not carry, such as one board saved
// out of a larger set. The stored OBF keeps those links for export; a loaded
// board offers only the links it can follow.
function keepStoredLinks(
  board: Board,
  storedBoardIds: ReadonlySet<string>,
): Board {
  return {
    ...board,
    buttons: board.buttons.map((button) =>
      button.linkedBoardId && !storedBoardIds.has(button.linkedBoardId)
        ? { ...button, linkedBoardId: undefined }
        : button,
    ),
  };
}
