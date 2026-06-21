import {
  boardSetPath,
  getBoardSets,
  importBoardFromUrl,
} from "@features/board";
import { redirect, type LoaderFunctionArgs } from "react-router";

const DEFAULT_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

async function resolveInitialRedirectPath(
  boardUrl: string | null,
): Promise<string> {
  if (boardUrl) {
    return boardSetPath(await importBoardFromUrl(boardUrl));
  }

  const [boardSet] = await getBoardSets();
  if (boardSet) {
    return boardSetPath(boardSet);
  }

  return boardSetPath(await importBoardFromUrl(DEFAULT_BOARD_URL));
}

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response> {
  const boardUrl = new URL(request.url).searchParams.get("board");
  const path = await resolveInitialRedirectPath(boardUrl);

  return redirect(path);
}
