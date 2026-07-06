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
async function importFromBoardUrl(
  boardUrl: string,
): Promise<Response | RootIndexData> {
  try {
    const existingSet = await getBoardSet(deriveSetIdFromUrl(boardUrl));

    if (existingSet) {
      return { pendingImport: { boardUrl, boardSetName: existingSet.name } };
    }

    return redirect(boardSetPath(await importBoardFromUrl(boardUrl)));
  } catch {
    throw data(m.boardUrlImportFailed(), { status: 400 });
  }
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
