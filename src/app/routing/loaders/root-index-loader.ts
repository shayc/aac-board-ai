import {
  rootBoardPath,
  listBoardSets,
  importBoardSetFromUrl,
} from "@features/board";
import { data, redirect, type LoaderFunctionArgs } from "react-router";
import { createRouteErrorPayload, routeErrorCodes } from "../route-error";

const STARTER_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

// The ?board= param is attacker-controlled: a crafted link must never
// silently replace a user's vocabulary. Every import allocates a separate
// board set ID, while rejected URLs and failed imports surface as localized
// errors.
async function importAndRedirect(
  boardUrl: string,
  signal: AbortSignal,
): Promise<Response> {
  try {
    const importedBoardSet = await importBoardSetFromUrl(boardUrl, signal);

    return redirect(rootBoardPath(importedBoardSet));
  } catch {
    signal.throwIfAborted();
    throw createImportFailure();
  }
}

function createImportFailure() {
  return data(createRouteErrorPayload(routeErrorCodes.boardUrlImportFailed), {
    status: 400,
  });
}

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response> {
  const boardUrl = new URL(request.url).searchParams.get("board");

  if (boardUrl) {
    return importAndRedirect(boardUrl, request.signal);
  }

  const [boardSet] = await listBoardSets();
  if (boardSet) {
    return redirect(rootBoardPath(boardSet));
  }

  const importedBoardSet = await importBoardSetFromUrl(
    STARTER_BOARD_URL,
    request.signal,
  );

  return redirect(rootBoardPath(importedBoardSet));
}
