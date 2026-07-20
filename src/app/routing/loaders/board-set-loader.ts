import { InvalidIdError, loadBoardSummaries } from "@features/board";
import { getStoredLanguage } from "@shared/language/language-store";
import { data, type LoaderFunctionArgs } from "react-router";
import type { BoardSetRouteData } from "../route-data";
import { createLocalizedRouteError, routeErrorCodes } from "../route-error";

export async function boardSetLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<BoardSetRouteData> {
  const { setId } = params;
  if (!setId) {
    throw data(createLocalizedRouteError(routeErrorCodes.boardSetNotFound), {
      status: 404,
    });
  }

  try {
    const language = getStoredLanguage();
    const boards = await loadBoardSummaries(setId, language, request.signal);

    return { language, boards };
  } catch (error) {
    if (error instanceof InvalidIdError) {
      throw data(createLocalizedRouteError(routeErrorCodes.boardSetNotFound), {
        status: 404,
      });
    }

    throw error;
  }
}
