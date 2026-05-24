import { boardPath } from "@app/routes";
import { getBoardSet } from "@features/board";
import { m } from "@paraglide/messages.js";
import { data, redirect, type LoaderFunctionArgs } from "react-router";

export async function boardSetIndexLoader({
  params,
}: LoaderFunctionArgs): Promise<Response> {
  const setId = params.setId!;
  const set = await getBoardSet(setId);

  if (!set) {
    throw data(m.errorBoardSetNotFound(), { status: 404 });
  }
  if (!set.rootBoardId) {
    throw data(m.errorBoardSetIncomplete(), { status: 422 });
  }

  return redirect(boardPath({ setId, boardId: set.rootBoardId }));
}
