import { getStoredBoardSet, rootBoardPath } from "@features/board";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

export async function boardSetIndexLoader({
  params,
}: LoaderFunctionArgs): Promise<Response> {
  const { boardSetId } = params;
  const boardSet = boardSetId ? await getStoredBoardSet(boardSetId) : undefined;

  if (!boardSet) {
    throw routeErrorResponse(routeErrorCodes.boardSetNotFound);
  }

  return redirect(rootBoardPath(boardSet));
}
