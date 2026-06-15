import { createTranslator } from "@shayc/react-built-in-ai";
import { updateBoardStrings } from "../storage/boards-db";
import type { Board } from "../types";
import {
  applyTranslations,
  collectTranslatableStrings,
  findTranslations,
  getBoardLanguage,
} from "./board-strings";

export async function resolveTranslatedBoard(
  setId: string,
  board: Board,
  language: string,
  signal?: AbortSignal,
): Promise<Board> {
  if (getBoardLanguage(board) === language) {
    return board;
  }

  const cached = findTranslations(board.strings, language) ?? {};
  const missing = Array.from(collectTranslatableStrings(board)).filter(
    (phrase) => !(phrase in cached),
  );

  if (missing.length === 0) {
    return applyTranslations(board, cached);
  }

  try {
    const translator = await createTranslator({
      sourceLanguage: getBoardLanguage(board),
      targetLanguage: language,
      signal,
    });

    try {
      const fresh = await translatePhrases(
        new Set(missing),
        translator,
        signal,
      );
      const translations = { ...cached, ...fresh };

      void persistTranslations(setId, board.id, language, translations);

      return applyTranslations(board, translations);
    } finally {
      translator.destroy();
    }
  } catch {
    // Deliberately total: the board must render no matter what — pictograms
    // carry the meaning. With no telemetry, rethrowing a bug here would only
    // trade the user's communication surface for an error page nobody hears
    // about.
    return Object.keys(cached).length > 0
      ? applyTranslations(board, cached)
      : board;
  }
}

async function translatePhrases(
  phrases: Set<string>,
  translator: Translator,
  signal?: AbortSignal,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Array.from(phrases).map(async (phrase) => {
      const translated = await translator.translate(phrase, { signal });

      return [phrase, translated] as const;
    }),
  );

  return Object.fromEntries(entries);
}

async function persistTranslations(
  setId: string,
  boardId: string,
  language: string,
  translations: Record<string, string>,
): Promise<void> {
  try {
    await updateBoardStrings(setId, boardId, language, translations);
  } catch {
    // Failure only costs a re-translation next load.
  }
}
