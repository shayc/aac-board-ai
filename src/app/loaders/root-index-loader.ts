import { getBoardSets, importBoardFromUrl } from "@features/board";
import { generatePath, redirect, type LoaderFunctionArgs } from "react-router";

const DEFAULT_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

async function resolveInitialBoard(boardUrl: string | null): Promise<string> {
  if (boardUrl) {
    const { setId, boardId } = await importBoardFromUrl(boardUrl);
    return generatePath("/sets/:setId/boards/:boardId", { setId, boardId });
  }

  const existingSets = await getBoardSets();
  if (existingSets.length > 0) {
    return generatePath("/sets/:setId", { setId: existingSets[0].setId });
  }

  const { setId, boardId } = await importBoardFromUrl(DEFAULT_BOARD_URL);
  return generatePath("/sets/:setId/boards/:boardId", { setId, boardId });
}

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response> {
  const boardUrl = new URL(request.url).searchParams.get("board");
  const path = await resolveInitialBoard(boardUrl);
  return redirect(path);
}
