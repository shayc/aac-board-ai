import { listBoardSummaries, type BoardSummary } from "@features/board";
import type { LoaderFunctionArgs } from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

export const BOARD_SET_ROUTE_ID = "board-set";

export async function boardSetLoader({
  params,
}: LoaderFunctionArgs): Promise<BoardSummary[]> {
  const { boardSetId } = params;
  if (!boardSetId) {
    throw routeErrorResponse(routeErrorCodes.boardSetNotFound);
  }

  return listBoardSummaries(boardSetId);
}
