import { generatePath } from "react-router";

export const BOARD_SET_PATTERN = "sets/:setId";
export const BOARD_PATTERN = "boards/:boardId";

export function boardPath({
  setId,
  boardId,
}: {
  setId: string;
  boardId: string;
}): string {
  return generatePath(`/${BOARD_SET_PATTERN}/${BOARD_PATTERN}`, {
    setId,
    boardId,
  });
}
