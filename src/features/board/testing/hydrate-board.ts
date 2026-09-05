import { BoardNotFoundError, getBoard } from "../storage/board-content-storage";
import {
  hydrateBoardRecord,
  type HydratedBoard,
} from "../storage/board-hydration";

export async function hydrateBoard(
  setId: string,
  boardId: string,
  signal?: AbortSignal,
): Promise<HydratedBoard> {
  const record = await getBoard(setId, boardId);
  if (!record) {
    throw new BoardNotFoundError(setId, boardId);
  }

  return hydrateBoardRecord(record, signal);
}
