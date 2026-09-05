import {
  BoardNotFoundError,
  hydrateBoardRecord,
  listBoards,
  InvalidIdError,
  resolveBoardForLanguage,
  type BoardMediaResource,
  type HydratedBoard,
  type LocalizedBoardContent,
} from "@features/board";
import { getStoredLanguage } from "@shared/language/language-store";
import { data, type LoaderFunctionArgs } from "react-router";
import { createRouteErrorPayload, routeErrorCodes } from "../route-error";

export interface BoardLoaderResult
  extends HydratedBoard, LocalizedBoardContent {
  setId: string;
}

export async function boardLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<BoardLoaderResult> {
  const { setId, boardId } = params;
  if (!setId || !boardId) {
    throw data(createRouteErrorPayload(routeErrorCodes.boardNotFound), {
      status: 404,
    });
  }

  let media: BoardMediaResource | undefined;
  try {
    const language = getStoredLanguage();
    const records = await listBoards(setId);
    records.sort(
      (left, right) =>
        left.name.localeCompare(right.name, "en") ||
        left.boardId.localeCompare(right.boardId, "en"),
    );
    const source = records.find((record) => record.boardId === boardId);
    if (!source) {
      throw new BoardNotFoundError(setId, boardId);
    }

    const hydrated = await hydrateBoardRecord(source, request.signal);
    media = hydrated.media;

    const localized = await resolveBoardForLanguage(
      hydrated.board,
      records,
      language,
      request.signal,
    );

    request.signal.throwIfAborted();

    return { ...localized, setId, media };
  } catch (error) {
    media?.dispose();

    if (
      error instanceof BoardNotFoundError ||
      error instanceof InvalidIdError
    ) {
      throw data(createRouteErrorPayload(routeErrorCodes.boardNotFound), {
        status: 404,
      });
    }

    throw error;
  }
}
