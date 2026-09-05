import {
  BoardNotFoundError,
  hydrateBoard,
  InvalidIdError,
  resolveBoardForLanguage,
  type BoardMediaResource,
  type HydratedBoard,
} from "@features/board";
import { getStoredLanguage } from "@shared/language/language-store";
import { data, type LoaderFunctionArgs } from "react-router";
import { createRouteErrorPayload, routeErrorCodes } from "../route-error";

export async function boardLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<HydratedBoard> {
  const { setId, boardId } = params;
  if (!setId || !boardId) {
    throw data(createRouteErrorPayload(routeErrorCodes.boardNotFound), {
      status: 404,
    });
  }

  let media: BoardMediaResource | undefined;
  try {
    const hydrated = await hydrateBoard(setId, boardId, request.signal);
    media = hydrated.media;

    const language = getStoredLanguage();
    const board = await resolveBoardForLanguage(
      setId,
      hydrated.board,
      language,
      request.signal,
    );

    request.signal.throwIfAborted();

    return { board, media };
  } catch (error) {
    media?.dispose();

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
