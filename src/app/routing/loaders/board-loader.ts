import {
  BoardNotFoundError,
  loadBoardInLanguage,
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
    return await loadBoardInLanguage(
      boardSetId,
      boardId,
      getStoredLanguage(),
      request.signal,
    );
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      throw routeErrorResponse(routeErrorCodes.boardNotFound);
    }

    throw error;
  }
}
