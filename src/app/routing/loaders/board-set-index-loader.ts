import { boardSetPath, getBoardSet, InvalidIdError } from "@features/board";
import { m } from "@paraglide/messages.js";
import { data, redirect, type LoaderFunctionArgs } from "react-router";

export async function boardSetIndexLoader({
  params,
}: LoaderFunctionArgs): Promise<Response> {
  const { setId } = params;
  let boardSet;
  try {
    boardSet = setId ? await getBoardSet(setId) : undefined;
  } catch (error) {
    if (error instanceof InvalidIdError) {
      boardSet = undefined;
    } else {
      throw error;
    }
  }

  if (!boardSet) {
    throw data(m.errorBoardSetNotFound(), { status: 404 });
  }

  return redirect(boardSetPath(boardSet));
}
