import {
  BoardNotFoundError,
  InvalidIdError,
  loadStoredBoard,
  rememberBoardSet,
  resolveBoardForLanguage,
  type Board,
} from "@features/board";
import { getStoredLanguage } from "@shared/language/language-store";
import { data, type LoaderFunctionArgs } from "react-router";
import { createRouteErrorPayload, routeErrorCodes } from "../route-error";

export async function boardLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<Board> {
  const { boardSetId, boardId } = params;
  if (!boardSetId || !boardId) {
    throw data(createRouteErrorPayload(routeErrorCodes.boardNotFound), {
      status: 404,
    });
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
    rememberBoardSet(boardSetId);

    return board;
  } catch (error) {
    if (
      error instanceof BoardNotFoundError ||
      error instanceof InvalidIdError
    ) {
      throw data(createRouteErrorPayload(routeErrorCodes.boardNotFound), {
        status: 404,
      });
    }

    throw error;
  }
}
