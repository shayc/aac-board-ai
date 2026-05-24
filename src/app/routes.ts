import { generatePath } from "react-router";

const BOARD_SET = "sets/:setId";
const BOARDS = "boards/:boardId";

export const ROUTE_PATTERNS = { BOARD_SET, BOARDS } as const;

export function boardSetPath({ setId }: { setId: string }): string {
  return generatePath(`/${BOARD_SET}`, { setId });
}

export function boardPath({
  setId,
  boardId,
}: {
  setId: string;
  boardId: string;
}): string {
  return generatePath(`/${BOARD_SET}/${BOARDS}`, { setId, boardId });
}
