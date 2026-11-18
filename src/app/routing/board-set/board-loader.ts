import { type Message, restoreMessageDraft } from "@features/board";
import {
  type Board,
  BoardNotFoundError,
  loadStoredBoard,
} from "@features/library";
import type { LoaderFunctionArgs } from "react-router";
import { ROUTE_ERROR_CODES, routeErrorResponse } from "../route-error";

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
    throw routeErrorResponse(ROUTE_ERROR_CODES.boardNotFound);
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
      throw routeErrorResponse(ROUTE_ERROR_CODES.boardNotFound);
    }

    throw error;
  }
}
