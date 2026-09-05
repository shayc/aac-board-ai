import { getBoardSet, InvalidIdError, rootBoardPath } from "@features/board";
import { data, redirect, type LoaderFunctionArgs } from "react-router";
import { createRouteErrorPayload, routeErrorCodes } from "../route-error";

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
    throw data(createRouteErrorPayload(routeErrorCodes.boardSetNotFound), {
      status: 404,
    });
  }

  return redirect(rootBoardPath(boardSet));
}
