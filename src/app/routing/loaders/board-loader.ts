import {
  BoardNotFoundError,
  loadBoard,
  InvalidIdError,
  type Board,
} from "@features/board";
import { data, type LoaderFunctionArgs } from "react-router";
import { createLocalizedRouteError, routeErrorCodes } from "../route-error";

export interface BoardRouteData {
  setId: string;
  board: Board;
}

export async function boardLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<BoardRouteData> {
  const { setId, boardId } = params;
  if (!setId || !boardId) {
    throw data(createLocalizedRouteError(routeErrorCodes.boardNotFound), {
      status: 404,
    });
  }

  try {
    const board = await loadBoard({ setId, boardId, signal: request.signal });

    return { setId, board };
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
