import { getBoardSetRecord, rootBoardPath } from "@features/library";
import { type LoaderFunctionArgs, redirect } from "react-router";
import { ROUTE_ERROR_CODES, routeErrorResponse } from "../errors/route-error";

export async function boardSetIndexLoader({
  params,
}: LoaderFunctionArgs): Promise<Response> {
  const { boardSetId } = params;
  const boardSet = boardSetId ? await getBoardSetRecord(boardSetId) : undefined;
  if (!boardSet) {
    throw routeErrorResponse(ROUTE_ERROR_CODES.boardSetNotFound);
  }

  return redirect(rootBoardPath(boardSet));
}
