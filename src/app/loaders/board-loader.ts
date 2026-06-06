import {
  BoardNotFoundError,
  hydrateBoard,
  resolveTranslatedBoard,
  type Board,
} from "@features/board";
import { m } from "@paraglide/messages.js";
import { getStoredLanguage } from "@shared/language/language-store";
import { data, type LoaderFunctionArgs } from "react-router";

export async function boardLoader({
  params,
  request,
}: LoaderFunctionArgs): Promise<Board> {
  const setId = params.setId!;
  const boardId = params.boardId!;

  try {
    const board = await hydrateBoard(setId, boardId, request.signal);
    const language = getStoredLanguage();

    return await resolveTranslatedBoard(setId, board, language, request.signal);
  } catch (error) {
    if (error instanceof BoardNotFoundError) {
      throw data(m.boardNotFound(), { status: 404 });
    }

    throw error;
  }
}
