import { importBoardFileFromURL, rootBoardPath } from "@features/board";
import { redirect, type ActionFunctionArgs } from "react-router";
import { routeErrorCodes, routeErrorResponse } from "../route-error";

// Reached only by confirming the ?board= dialog, so this is the one place a
// link imports. Each import allocates a separate board set ID, and rejected
// URLs and failed imports surface as localized errors.
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
