import { generatePath } from "react-router";

export const BOARD_SET_SEGMENT = "sets/:boardSetId";
export const BOARD_SEGMENT = "boards/:boardId";
export const BOARD_ROUTE_PATTERN = `/${BOARD_SET_SEGMENT}/${BOARD_SEGMENT}`;

export function boardPath({
  boardSetId,
  boardId,
}: {
  boardSetId: string;
  boardId: string;
}): string {
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
