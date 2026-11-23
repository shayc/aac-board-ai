import {
  importBoardFileFromURL,
  listBoardSetRecords,
  parseBoardFileURL,
  rootBoardPath,
  starterBoardSet,
} from "@features/library";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from "react-router";
import { ROUTE_ERROR_CODES, routeErrorResponse } from "../errors/route-error";

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response | { boardFileHost: string }> {
  const boardFileURL = new URL(request.url).searchParams.get("board");

  // The ?board= param is attacker-controlled, so a link alone must never
  // import. rootIndexAction imports once the user confirms the host.
  if (boardFileURL) {
    return { boardFileHost: parseBoardFileHost(boardFileURL) };
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
  const boardFileURL = new URL(request.url).searchParams.get("board");
  if (!boardFileURL) {
    return redirect("/");
  }

  try {
    const importedBoardSet = await importBoardFileFromURL(boardFileURL, {
      signal: request.signal,
    });

    return redirect(rootBoardPath(importedBoardSet));
  } catch (error) {
    request.signal.throwIfAborted();
    failBoardFileURLImport(error);
  }
}

function parseBoardFileHost(boardFileURL: string): string {
  try {
    return parseBoardFileURL(boardFileURL).host;
  } catch (error) {
    failBoardFileURLImport(error);
  }
}

/**
 * Ends a `?board=` navigation on the "import failed" page. That page names no
 * cause and reportRouteError skips it, so the cause is reported here.
 */
function failBoardFileURLImport(cause: unknown): never {
  reportError(cause);
  throw routeErrorResponse(ROUTE_ERROR_CODES.boardFileURLImportFailed);
}
