import { getBoardSetRecord, rootBoardPath } from "@features/library";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

export async function boardSetIndexLoader({
  params,
}: LoaderFunctionArgs): Promise<Response> {
  const { boardSetId } = params;
  const boardSet = boardSetId ? await getBoardSetRecord(boardSetId) : undefined;

  if (!boardSet) {
    throw routeErrorResponse(routeErrorCodes.boardSetNotFound);
  }

  return redirect(rootBoardPath(boardSet));
}
