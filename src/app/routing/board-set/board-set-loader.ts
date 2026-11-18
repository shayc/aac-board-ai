import {
  type BoardSummary,
  getBoardSetRecord,
  listBoardSummaries,
} from "@features/library";
import type { LoaderFunctionArgs } from "react-router";
import { ROUTE_ERROR_CODES, routeErrorResponse } from "../route-error";

export const BOARD_SET_ROUTE_ID = "board-set";

interface BoardSetRouteData {
  /** Undefined for a set that isn't stored; the board loader reports it. */
  rootBoardId: string | undefined;
  boards: BoardSummary[];
}

export async function boardSetLoader({
  params,
}: LoaderFunctionArgs): Promise<BoardSetRouteData> {
  const { boardSetId } = params;
  if (!boardSetId) {
    throw routeErrorResponse(ROUTE_ERROR_CODES.boardSetNotFound);
  }

  const [boardSet, boards] = await Promise.all([
    getBoardSetRecord(boardSetId),
    listBoardSummaries(boardSetId),
  ]);

  return { rootBoardId: boardSet?.rootBoardId, boards };
}
