import { type Message, restoreMessageDraft } from "@features/board";
import {
  type Board,
  BoardNotFoundError,
  loadStoredBoard,
} from "@features/library";
import type { LoaderFunctionArgs } from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

export interface BoardRouteData {
  board: Board;
  restoredMessage: Message;
}

export async function boardLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<BoardRouteData> {
  const { boardSetId, boardId } = params;
  if (!boardSetId || !boardId) {
    throw routeErrorResponse(routeErrorCodes.boardNotFound);
  }

  const [board, restoredMessage] = await Promise.all([
    loadBoard(boardSetId, boardId, request.signal),
    restoreMessageDraft(),
  ]);

  return { board, restoredMessage };
}

async function loadBoard(
  boardSetId: string,
  boardId: string,
  signal: AbortSignal,
): Promise<Board> {
  try {
    return await loadStoredBoard({ boardSetId, boardId }, signal);
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      throw routeErrorResponse(routeErrorCodes.boardNotFound);
    }

    throw error;
  }
}
