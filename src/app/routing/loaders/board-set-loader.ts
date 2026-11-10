import {
  getBoardSetRecord,
  listBoardSummaries,
  type BoardSummary,
} from "@features/board";
import type { LoaderFunctionArgs } from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

export const BOARD_SET_ROUTE_ID = "board-set";

interface BoardSetRouteData {
  /** Undefined for a set that isn't stored; the board loader reports it. */
  rootBoardId: string | undefined;
  summaries: BoardSummary[];
}

export async function boardSetLoader({
  params,
}: LoaderFunctionArgs): Promise<BoardSetRouteData> {
  const { boardSetId } = params;
  if (!boardSetId) {
    throw routeErrorResponse(routeErrorCodes.boardSetNotFound);
  }

  const [boardSet, summaries] = await Promise.all([
    getBoardSetRecord(boardSetId),
    listBoardSummaries(boardSetId),
  ]);

  return { rootBoardId: boardSet?.rootBoardId, summaries };
}
