import {
  boardSetPath,
  deriveSetIdFromUrl,
  getBoardSet,
  getBoardSets,
  importBoardFromUrl,
} from "@features/board";
import { m } from "@paraglide/messages.js";
import { data, redirect, type LoaderFunctionArgs } from "react-router";

const DEFAULT_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

export interface RootIndexData {
  pendingImport: {
    boardUrl: string;
    boardSetName: string;
  };
}

// The ?board= param is attacker-controlled: a crafted link must never
// silently replace a user's vocabulary. An import that would overwrite an
// existing set is returned as an intent for BoardUrlImportPage to confirm,
// and a rejected URL or failed import surfaces as a localized error state.
// Storage errors propagate to the generic error boundary instead — they are
// not the link's fault and must not be reported as a bad link.
async function importFromBoardUrl(
  boardUrl: string,
): Promise<Response | RootIndexData> {
  let setId: string;
  try {
    setId = deriveSetIdFromUrl(boardUrl);
  } catch {
    throw importFailed();
  }

  const existingSet = await getBoardSet(setId);
  if (existingSet) {
    return { pendingImport: { boardUrl, boardSetName: existingSet.name } };
  }

  try {
    return redirect(boardSetPath(await importBoardFromUrl(boardUrl)));
  } catch {
    throw importFailed();
  }
}

function importFailed() {
  return data(m.boardUrlImportFailed(), { status: 400 });
}

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response | RootIndexData> {
  const boardUrl = new URL(request.url).searchParams.get("board");

  if (boardUrl) {
    return importFromBoardUrl(boardUrl);
  }

  const [boardSet] = await getBoardSets();
  if (boardSet) {
    return redirect(boardSetPath(boardSet));
  }

  return redirect(boardSetPath(await importBoardFromUrl(DEFAULT_BOARD_URL)));
}
