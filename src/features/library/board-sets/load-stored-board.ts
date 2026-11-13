import type { OBFBoard } from "@shayc/open-board-format";
import type { Board, BoardKey } from "../board-types";
import { obfToBoard } from "../obf/obf-to-board";
import { getAssetURL } from "../storage/asset-urls";
import {
  BoardNotFoundError,
  getBoardRecord,
  listBoardIds,
} from "../storage/board-content-storage";

export async function loadStoredBoard(
  key: BoardKey,
  signal?: AbortSignal,
): Promise<Board> {
  const obfBoard = await readOBFBoard(key);
  signal?.throwIfAborted();

  const [assetURLByPath, storedBoardIds] = await Promise.all([
    resolveAssetURLs(key.boardSetId, obfBoard),
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

async function resolveAssetURLs(
  boardSetId: string,
  obfBoard: OBFBoard,
): Promise<Map<string, string>> {
  const entries = await Promise.all(
    Array.from(collectMediaPaths(obfBoard), async (path) => {
      // A board missing one picture or sound is still usable; failing the
      // whole load would leave the user with no board at all.
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
