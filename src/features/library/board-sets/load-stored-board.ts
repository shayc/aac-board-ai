import { reportErrorsTogether } from "@shared/utils/report-errors-together";
import { settleAll } from "@shared/utils/settle-all";
import type { OBFBoard } from "@shayc/open-board-format";
import type { Board, BoardKey } from "../board-types";
import { collectMediaPaths } from "../obf/collect-media-paths";
import { obfToBoard } from "../obf/obf-to-board";
import { getAssetURL } from "../storage/asset-urls";
import { getBoardRecord, listBoardIds } from "../storage/board-content-storage";

export class BoardNotFoundError extends Error {
  constructor({ boardSetId, boardId }: BoardKey) {
    super(`Board not found: ${boardSetId}/${boardId}`);
    this.name = "BoardNotFoundError";
  }
}

export async function loadStoredBoard(
  key: BoardKey,
  signal?: AbortSignal,
): Promise<Board> {
  const obfBoard = await readOBFBoard(key);
  signal?.throwIfAborted();

  const [assetURLByPath, storedBoardIds] = await Promise.all([
    readAssetURLs(key.boardSetId, obfBoard),
    listBoardIds(key.boardSetId),
  ]);
  signal?.throwIfAborted();

  return withoutBrokenLinks(
    obfToBoard(obfBoard, assetURLByPath),
    new Set(storedBoardIds),
  );
}

async function readOBFBoard(key: BoardKey): Promise<OBFBoard> {
  const record = await getBoardRecord(key);
  if (!record) {
    throw new BoardNotFoundError(key);
  }

  return record.obf;
}

async function readAssetURLs(
  boardSetId: string,
  obfBoard: OBFBoard,
): Promise<Map<string, string>> {
  // A board missing a picture or sound is still usable; don't fail the load.
  const { values: assetURLEntries, errors } = await settleAll(
    Array.from(
      collectMediaPaths([obfBoard]),
      async (path) => [path, await getAssetURL(boardSetId, path)] as const,
    ),
  );
  reportErrorsTogether(
    errors,
    `Failed to read stored assets of board set ${boardSetId}`,
  );

  const assetURLByPath = new Map<string, string>();

  for (const [path, url] of assetURLEntries) {
    if (url) {
      assetURLByPath.set(path, url);
    }
  }

  return assetURLByPath;
}

// Broken links are dropped here, not at import: the stored file keeps them so
// export writes back what was imported.
function withoutBrokenLinks(
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
