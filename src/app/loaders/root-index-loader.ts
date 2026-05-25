import { boardPath } from "@app/route-patterns";
import {
  getBoardSets,
  importBoardFromUrl,
  type BoardSetRecord,
} from "@features/board";
import { redirect, type LoaderFunctionArgs } from "react-router";

const DEFAULT_BOARD_URL = `${import.meta.env.BASE_URL}quick-core-24.obz`;

function hasRootBoard(
  set: BoardSetRecord,
): set is BoardSetRecord & { rootBoardId: string } {
  return Boolean(set.rootBoardId);
}

async function resolveInitialRedirectPath(
  boardUrl: string | null,
): Promise<string> {
  if (boardUrl) {
    const { setId, boardId } = await importBoardFromUrl(boardUrl);
    return boardPath({ setId, boardId });
  }

  const existing = (await getBoardSets()).find(hasRootBoard);
  if (existing) {
    return boardPath({ setId: existing.setId, boardId: existing.rootBoardId });
  }

  const { setId, boardId } = await importBoardFromUrl(DEFAULT_BOARD_URL);
  return boardPath({ setId, boardId });
}

export async function rootIndexLoader({
  request,
}: LoaderFunctionArgs): Promise<Response> {
  const boardUrl = new URL(request.url).searchParams.get("board");
  const path = await resolveInitialRedirectPath(boardUrl);
  return redirect(path);
}
