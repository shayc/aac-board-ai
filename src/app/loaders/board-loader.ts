import { BoardNotFoundError, loadBoard, type Board } from "@features/board";
import { data, type LoaderFunctionArgs } from "react-router";

export async function boardLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<Board> {
  const setId = params.setId!;
  const boardId = params.boardId!;

  try {
    return await loadBoard(setId, boardId, request.signal);
  } catch (err) {
    if (err instanceof BoardNotFoundError) {
      throw data("Board not found", { status: 404 });
    }
    throw err;
  }
}
