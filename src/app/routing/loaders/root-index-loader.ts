import {
  rootBoardPath,
  listBoardSetRecords,
  importBoardFileFromURL,
  parseBoardURL,
  starterBoardSet,
} from "@features/board";
import {
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

// The ?board= param is attacker-controlled, and `/` opens the newest board
// set, so a link alone must never import. The loader only validates the URL
// for the confirmation dialog; the import runs in the action once the user
// confirms.
function boardURLFromRequest(request: Request): string | null {
  return new URL(request.url).searchParams.get("board");
}

function boardLinkHost(boardURL: string): string {
  try {
    return parseBoardURL(boardURL).host;
  } catch {
    throw routeErrorResponse(routeErrorCodes.boardURLImportFailed);
  }
}

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response | { boardHost: string }> {
  const boardURL = boardURLFromRequest(request);

  if (boardURL) {
    return { boardHost: boardLinkHost(boardURL) };
  }

  const [boardSet] = await listBoardSetRecords();
  if (boardSet) {
    return redirect(rootBoardPath(boardSet));
  }

  const importedBoardSet = await importBoardFileFromURL(starterBoardSet.url, {
    signal: request.signal,
  });

  return redirect(rootBoardPath(importedBoardSet));
}

export async function rootIndexAction({
  request,
}: ActionFunctionArgs): Promise<Response> {
  const boardURL = boardURLFromRequest(request);

  if (!boardURL) {
    return redirect("/");
  }

  try {
    const importedBoardSet = await importBoardFileFromURL(boardURL, {
      signal: request.signal,
    });

    return redirect(rootBoardPath(importedBoardSet));
  } catch {
    request.signal.throwIfAborted();
    throw routeErrorResponse(routeErrorCodes.boardURLImportFailed);
  }
}
