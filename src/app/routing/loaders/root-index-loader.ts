import {
  boardSetPath,
  getBoardSets,
  importBoardFromUrl,
} from "@features/board";
import { redirect, type LoaderFunctionArgs } from "react-router";

const DEFAULT_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

async function getOrImportBoardSet(
  boardUrl: string | null,
): Promise<{ setId: string; rootBoardId: string }> {
  if (boardUrl) {
    return importBoardFromUrl(boardUrl);
  }

  const [boardSet] = await getBoardSets();
  if (boardSet) {
    return boardSet;
  }

  return importBoardFromUrl(DEFAULT_BOARD_URL);
}

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response> {
  const boardUrl = new URL(request.url).searchParams.get("board");

  return redirect(boardSetPath(await getOrImportBoardSet(boardUrl)));
}
