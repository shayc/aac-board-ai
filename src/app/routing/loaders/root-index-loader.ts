import {
  rootBoardPath,
  listBoardSets,
  importBoardFileFromURL,
} from "@features/board";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

const STARTER_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

// The ?board= param is attacker-controlled: a crafted link must never
// silently replace a user's vocabulary. Every import allocates a separate
// board set ID, while rejected URLs and failed imports surface as localized
// errors.
async function importAndRedirect(
  boardURL: string,
  signal: AbortSignal,
): Promise<Response> {
  try {
    const importedBoardSet = await importBoardFileFromURL(boardURL, signal);

    return redirect(rootBoardPath(importedBoardSet));
  } catch {
    signal.throwIfAborted();
    throw routeErrorResponse(routeErrorCodes.boardURLImportFailed);
  }
}

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response> {
  const boardURL = new URL(request.url).searchParams.get("board");

  if (boardURL) {
    return importAndRedirect(boardURL, request.signal);
  }

  const [boardSet] = await listBoardSets();
  if (boardSet) {
    return redirect(rootBoardPath(boardSet));
  }

  const importedBoardSet = await importBoardFileFromURL(
    STARTER_BOARD_URL,
    request.signal,
  );

  return redirect(rootBoardPath(importedBoardSet));
}
