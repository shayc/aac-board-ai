import { importBoardFileFromURL, rootBoardPath } from "@features/library";
import { redirect, type ActionFunctionArgs } from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

export async function rootIndexAction({
  request,
}: ActionFunctionArgs): Promise<Response> {
  const boardURL = new URL(request.url).searchParams.get("board");

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
