import { createTranslator } from "@shayc/react-built-in-ai";
import { replaceBoardTranslations } from "../storage/board-content-storage";
import type { Board } from "../board-types";
import {
  applyTranslations,
  collectTranslatablePhrases,
  findBoardForLanguage,
  getBoardLanguage,
} from "./board-translations";

export async function resolveBoardForLanguage(
  boardSetId: string,
  board: Board,
  language: string,
  signal?: AbortSignal,
): Promise<Board> {
  const existing = findBoardForLanguage(board, language);
  if (existing) {
    return existing;
  }

  const phrases = collectTranslatablePhrases(board);
  if (phrases.size === 0) {
    return board;
  }

  try {
    const translator = await createTranslator({
      sourceLanguage: getBoardLanguage(board),
      targetLanguage: language,
      signal,
    });

    try {
      const translations = await translatePhrases(phrases, translator, signal);

      void persistTranslations(boardSetId, board.id, language, translations);

      return applyTranslations(board, translations);
    } finally {
      translator.destroy();
    }
  } catch {
    // Translation is optional; failures must leave the source board usable.
    return board;
  }
}

async function translatePhrases(
  phrases: Set<string>,
  translator: Translator,
  signal?: AbortSignal,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Array.from(phrases, async (phrase) => {
      const translated = await translator.translate(phrase, { signal });

      return [phrase, translated] as const;
    }),
  );

  return Object.fromEntries(entries);
}

async function persistTranslations(
  boardSetId: string,
  boardId: string,
  language: string,
  translations: Record<string, string>,
): Promise<void> {
  try {
    await replaceBoardTranslations(boardSetId, boardId, language, translations);
  } catch {
    // Failure only costs a re-translation next load.
  }
}
