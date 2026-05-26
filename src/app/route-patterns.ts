import { generatePath } from "react-router";

const BOARD_SET = "sets/:setId";
const BOARDS = "boards/:boardId";
const LIBRARY = "library";
const ABOUT = "about";

export const ROUTE_PATTERNS = { BOARD_SET, BOARDS, LIBRARY, ABOUT } as const;

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

export const LIBRARY_PATH = `/${LIBRARY}` as const;
export const ABOUT_PATH = `/${ABOUT}` as const;
