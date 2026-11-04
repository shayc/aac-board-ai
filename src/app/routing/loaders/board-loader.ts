import {
  BoardNotFoundError,
  loadStoredBoard,
  resolveBoardForLanguage,
  type Board,
} from "@features/board";
import { getStoredLanguage } from "@shared/language/language-store";
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
    const sourceBoard = await loadStoredBoard(
      boardSetId,
      boardId,
      request.signal,
    );

    const language = getStoredLanguage();
    const board = await resolveBoardForLanguage(
      boardSetId,
      sourceBoard,
      language,
      request.signal,
    );

    request.signal.throwIfAborted();

    return board;
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      throw routeErrorResponse(routeErrorCodes.boardNotFound);
    }

    throw error;
  }
}
