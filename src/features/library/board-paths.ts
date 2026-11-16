import { generatePath, matchRoutes, useLocation } from "react-router";
import type { BoardKey } from "./board-types";

// The URL scheme lives in the library because the library links and redirects
// to boards and may import no feature, while the board and the app may import it.
export const BOARD_SET_SEGMENT = "sets/:boardSetId";
export const BOARD_SEGMENT = "boards/:boardId";
export const BOARD_ROUTE_PATTERN = `/${BOARD_SET_SEGMENT}/${BOARD_SEGMENT}`;

export function boardSetIdFromPath(pathname: string): string | undefined {
  const [match] =
    matchRoutes([{ path: `/${BOARD_SET_SEGMENT}/*` }], pathname) ?? [];

  return match?.params.boardSetId;
}

/** The board set on screen, whichever of its boards is open. */
export function useActiveBoardSetId(): string | undefined {
  return boardSetIdFromPath(useLocation().pathname);
}

export function boardPath({ boardSetId, boardId }: BoardKey): string {
  return generatePath(BOARD_ROUTE_PATTERN, { boardSetId, boardId });
}

export function rootBoardPath({
  id,
  rootBoardId,
}: {
  id: string;
  rootBoardId: string;
}): string {
  return boardPath({ boardSetId: id, boardId: rootBoardId });
}
