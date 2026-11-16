import type { Board } from "../board-types";
import { obfToBoard } from "../obf/obf-to-board";
import { getBoardRecord } from "../storage/board-content-storage";

/**
 * Boards as text only: no picture or sound is resolved, so reading many boards
 * stays cheap. Boards that are not stored are left out.
 */
export async function loadStoredBoardTexts(
  boardSetId: string,
  boardIds: readonly string[],
  signal?: AbortSignal,
): Promise<Board[]> {
  const records = await Promise.all(
    boardIds.map((boardId) => getBoardRecord({ boardSetId, boardId })),
  );
  signal?.throwIfAborted();

  return records.flatMap((record) => (record ? [obfToBoard(record.obf)] : []));
}
