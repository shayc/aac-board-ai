import { generatePath, matchRoutes, useLocation } from "react-router";
import type { BoardKey } from "./board-types";

export const BOARD_SET_SEGMENT = "sets/:boardSetId";
export const BOARD_SEGMENT = "boards/:boardId";
export const BOARD_ROUTE_PATTERN = `/${BOARD_SET_SEGMENT}/${BOARD_SEGMENT}`;

export function boardSetIdFromPath(pathname: string): string | undefined {
  const [match] =
    matchRoutes([{ path: `/${BOARD_SET_SEGMENT}/*` }], pathname) ?? [];

  return match?.params.boardSetId;
}

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
