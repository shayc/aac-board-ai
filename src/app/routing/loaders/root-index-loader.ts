import {
  importBoardSetFromUrl,
  listBoardSets,
  rootBoardPath,
  selectLaunchBoardSet,
} from "@features/board";
import { redirect, type LoaderFunctionArgs } from "react-router";

const STARTER_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response> {
  const boardSet =
    selectLaunchBoardSet(await listBoardSets()) ??
    (await importBoardSetFromUrl(STARTER_BOARD_URL, request.signal));

  // The search keeps a ?board= link for BoardLinkPrompt, which asks over this board.
  const { search } = new URL(request.url);

  return redirect(`${rootBoardPath(boardSet)}${search}`);
}
