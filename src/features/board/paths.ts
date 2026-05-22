import { generatePath } from "react-router";

export function boardSetPath({ setId }: { setId: string }): string {
  return generatePath("/sets/:setId", { setId });
}

export function boardPath({
  setId,
  boardId,
}: {
  setId: string;
  boardId: string;
}): string {
  return generatePath("/sets/:setId/boards/:boardId", { setId, boardId });
}
