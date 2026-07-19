import {
  boardSetPath,
  getBoardSets,
  importBoardFromUrl,
} from "@features/board";
import { data, redirect, type LoaderFunctionArgs } from "react-router";
import { createLocalizedRouteError, routeErrorCodes } from "../route-error";

const DEFAULT_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

// The ?board= param is attacker-controlled: a crafted link must never
// silently replace a user's vocabulary. Every import allocates a separate set
// ID, while rejected URLs and failed imports surface as localized errors.
async function importFromBoardUrl(boardUrl: string): Promise<Response> {
  try {
    return redirect(boardSetPath(await importBoardFromUrl(boardUrl)));
  } catch {
    throw importFailed();
  }
}

function importFailed() {
  return data(createLocalizedRouteError(routeErrorCodes.boardUrlImportFailed), {
    status: 400,
  });
}

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response> {
  const boardUrl = new URL(request.url).searchParams.get("board");

  if (boardUrl) {
    return importFromBoardUrl(boardUrl);
  }

  const [boardSet] = await getBoardSets();
  if (boardSet) {
    return redirect(boardSetPath(boardSet));
  }

  return redirect(boardSetPath(await importBoardFromUrl(DEFAULT_BOARD_URL)));
}
