import { generatePath } from "react-router";

export const BOARD_SET_SEGMENT = "sets/:setId";
export const BOARD_SEGMENT = "boards/:boardId";
export const BOARD_ROUTE_PATTERN = `/${BOARD_SET_SEGMENT}/${BOARD_SEGMENT}`;

export function boardPath({
  setId,
  boardId,
}: {
  setId: string;
  boardId: string;
}): string {
  return generatePath(BOARD_ROUTE_PATTERN, { setId, boardId });
}

export function boardSetPath({
  setId,
  rootBoardId,
}: {
  setId: string;
  rootBoardId: string;
}): string {
  return boardPath({ setId, boardId: rootBoardId });
}
