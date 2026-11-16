import {
  importBoardFileFromURL,
  listBoardSetRecords,
  parseBoardFileURL,
  rootBoardPath,
  starterBoardSet,
} from "@features/library";
import { type LoaderFunctionArgs, redirect } from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

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

function parseBoardFileHost(boardFileURL: string): string {
  try {
    return parseBoardFileURL(boardFileURL).host;
  } catch {
    throw routeErrorResponse(routeErrorCodes.boardFileURLImportFailed);
  }
}
