import { boardSetPath, getBoardSet } from "@features/board";
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

  return redirect(boardSetPath(set));
}
