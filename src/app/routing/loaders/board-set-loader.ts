import { listBoardNamesInLanguage, type BoardName } from "@features/board";
import { getStoredLanguage } from "@shared/language/language-store";
import type { LoaderFunctionArgs } from "react-router";

export const BOARD_SET_ROUTE_ID = "board-set";

export async function boardSetLoader({
  params,
}: LoaderFunctionArgs): Promise<BoardName[]> {
  const { boardSetId } = params;
  if (!boardSetId) {
    return [];
  }

  return listBoardNamesInLanguage(boardSetId, getStoredLanguage());
}
