import {
  rootBoardPath,
  listBoardSets,
  importBoardSetFromUrl,
  parseBoardUrl,
} from "@features/board";
import {
  data,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createRouteErrorPayload, routeErrorCodes } from "../route-error";

const STARTER_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

export interface BoardUrlImportPromptData {
  boardUrlHost: string;
}

// The ?board= param is attacker-controlled: a crafted link must never
// silently add vocabulary or replace a user's boards. The loader only asks
// for confirmation; the import runs in the action once the user accepts, and
// always allocates a separate board set ID.
export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response | BoardUrlImportPromptData> {
  const boardUrl = readBoardUrl(request);

  if (boardUrl) {
    return { boardUrlHost: resolveBoardUrlHost(boardUrl) };
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

export async function rootIndexAction({
  request,
}: ActionFunctionArgs): Promise<Response> {
  const boardUrl = readBoardUrl(request);

  if (!boardUrl) {
    return redirect("/");
  }

  try {
    const importedBoardSet = await importBoardSetFromUrl(
      boardUrl,
      request.signal,
    );

    return redirect(rootBoardPath(importedBoardSet));
  } catch {
    request.signal.throwIfAborted();
    throw createImportFailure();
  }
}

function readBoardUrl(request: Request): string | null {
  const boardUrl = new URL(request.url).searchParams.get("board");
  if (!boardUrl || hasScheme(boardUrl) || boardUrl.startsWith("/")) {
    return boardUrl;
  }

  return `https://${boardUrl}`;
}

function hasScheme(url: string): boolean {
  return /^[a-z][a-z\d+.-]*:/i.test(url);
}

function resolveBoardUrlHost(boardUrl: string): string {
  try {
    return parseBoardUrl(boardUrl).host;
  } catch {
    throw createImportFailure();
  }
}

function createImportFailure() {
  return data(createRouteErrorPayload(routeErrorCodes.boardUrlImportFailed), {
    status: 400,
  });
}
