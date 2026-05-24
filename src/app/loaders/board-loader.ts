import { BoardNotFoundError, hydrateBoard, type Board } from "@features/board";
import { m } from "@paraglide/messages.js";
import { data, type LoaderFunctionArgs } from "react-router";

export async function boardLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<Board> {
  const setId = params.setId!;
  const boardId = params.boardId!;

  try {
    return await hydrateBoard(setId, boardId, request.signal);
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      throw data(m.boardNotFound(), { status: 404 });
    }
    throw error;
  }
}
