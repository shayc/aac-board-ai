import {
  BoardNotFoundError,
  loadStoredBoard,
  type Board,
} from "@features/board";
import type { LoaderFunctionArgs } from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

export async function boardLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<Board> {
  const { boardSetId, boardId } = params;
  if (!boardSetId || !boardId) {
    throw routeErrorResponse(routeErrorCodes.boardNotFound);
  }

  try {
    return await loadStoredBoard({ boardSetId, boardId }, request.signal);
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      throw routeErrorResponse(routeErrorCodes.boardNotFound);
    }

    throw error;
  }
}
