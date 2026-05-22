import { getBoardSet } from "@features/board";
import {
  data,
  generatePath,
  redirect,
  type LoaderFunctionArgs,
} from "react-router";

export async function boardSetIndexLoader({
  params,
}: LoaderFunctionArgs): Promise<Response> {
  const setId = params.setId ?? "";
  const set = await getBoardSet(setId);

  if (!set) {
    throw data("Board set not found", { status: 404 });
  }
  if (!set.rootBoardId) {
    throw data("Board set incomplete", { status: 422 });
  }

  return redirect(
    generatePath("/sets/:setId/boards/:boardId", {
      setId,
      boardId: set.rootBoardId,
    }),
  );
}
