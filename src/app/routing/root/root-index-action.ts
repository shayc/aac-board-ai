import { importBoardFileFromURL, rootBoardPath } from "@features/library";
import { type ActionFunctionArgs, redirect } from "react-router";
import { failBoardFileURLImport } from "./fail-board-file-url-import";

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
