import {
  rootBoardPath,
  listBoardSetRecords,
  importBoardFileFromURL,
  parseBoardURL,
  starterBoardSet,
} from "@features/board";
import { redirect, type LoaderFunctionArgs } from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

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
  const boardURL = new URL(request.url).searchParams.get("board");

  // The ?board= param is attacker-controlled, so a link alone must never
  // import. rootIndexAction imports once the user confirms the host.
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
