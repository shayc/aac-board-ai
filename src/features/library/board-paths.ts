import { generatePath, matchPath } from "react-router";
import type { BoardKey } from "./board-types";

// The URL scheme lives in the library because the library links and redirects
// to boards and may import no feature, while the board and the app may import it.
export const BOARD_SET_SEGMENT = "sets/:boardSetId";
export const BOARD_SEGMENT = "boards/:boardId";
export const BOARD_ROUTE_PATTERN = `/${BOARD_SET_SEGMENT}/${BOARD_SEGMENT}`;

export function boardSetIdFromPath(pathname: string): string | undefined {
  return matchPath({ path: `/${BOARD_SET_SEGMENT}`, end: false }, pathname)
    ?.params.boardSetId;
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
