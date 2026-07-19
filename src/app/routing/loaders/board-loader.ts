import {
  BoardNotFoundError,
  hydrateBoard,
  InvalidIdError,
  resolveTranslatedBoard,
  type Board,
} from "@features/board";
import { getStoredLanguage } from "@shared/language/language-store";
import { data, type LoaderFunctionArgs } from "react-router";
import { createLocalizedRouteError, routeErrorCodes } from "../route-error";

export async function boardLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<Board> {
  const { setId, boardId } = params;
  if (!setId || !boardId) {
    throw data(createLocalizedRouteError(routeErrorCodes.boardNotFound), {
      status: 404,
    });
  }

  try {
    const board = await hydrateBoard(setId, boardId, request.signal);
    const language = getStoredLanguage();

    return await resolveTranslatedBoard(setId, board, language, request.signal);
  } catch (error) {
    if (
      error instanceof BoardNotFoundError ||
      error instanceof InvalidIdError
    ) {
      throw data(createLocalizedRouteError(routeErrorCodes.boardNotFound), {
        status: 404,
      });
    }

    throw error;
  }
}
