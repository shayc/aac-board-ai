import {
  BoardNotFoundError,
  InvalidIdError,
  loadStoredBoard,
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
  const { setId, boardId } = params;
  if (!setId || !boardId) {
    throw data(createRouteErrorPayload(routeErrorCodes.boardNotFound), {
      status: 404,
    });
  }

  try {
    const sourceBoard = await loadStoredBoard(setId, boardId, request.signal);

    const language = getStoredLanguage();
    const board = await resolveBoardForLanguage(
      setId,
      sourceBoard,
      language,
      request.signal,
    );

    request.signal.throwIfAborted();

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
