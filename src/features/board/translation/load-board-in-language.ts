import { createTranslator } from "@shayc/react-built-in-ai";
import type { Board, PhraseTranslations } from "../board-types";
import { replaceBoardTranslations } from "../storage/board-content-storage";
import { loadStoredBoard } from "../storage/load-stored-board";
import {
  applyTranslations,
  collectTranslatablePhrases,
  findBoardInLanguage,
  getBoardLanguage,
} from "./board-translations";

/**
 * Loads a stored board in the requested language, translating and caching it
 * on a cache miss, and falling back to the source board when translation is
 * unavailable or fails.
 */
export async function loadBoardInLanguage(
  boardSetId: string,
  boardId: string,
  language: string,
  signal?: AbortSignal,
): Promise<Board> {
  const board = await loadStoredBoard(boardSetId, boardId, signal);

  const existing = findBoardInLanguage(board, language);
  if (existing) {
    return existing;
  }

  const translations = await translateBoard(board, language, signal);
  if (!translations) {
    return board;
  }

  void cacheTranslations(boardSetId, boardId, language, translations);

  return applyTranslations(board, translations);
}

async function translateBoard(
  board: Board,
  language: string,
  signal?: AbortSignal,
): Promise<PhraseTranslations | undefined> {
  const phrases = collectTranslatablePhrases(board);
  if (phrases.size === 0) {
    return undefined;
  }

  try {
    const translator = await createTranslator({
      sourceLanguage: getBoardLanguage(board),
      targetLanguage: language,
      signal,
    });

    try {
      return await translatePhrases(phrases, translator, signal);
    } finally {
      translator.destroy();
    }
  } catch {
    // Translation is optional; failures must leave the source board usable.
    return undefined;
  }
}

async function translatePhrases(
  phrases: Set<string>,
  translator: Translator,
  signal?: AbortSignal,
): Promise<PhraseTranslations> {
  const entries = await Promise.all(
    Array.from(phrases, async (phrase) => {
      const translated = await translator.translate(phrase, { signal });

      return [phrase, translated] as const;
    }),
  );

  return Object.fromEntries(entries);
}

async function cacheTranslations(
  boardSetId: string,
  boardId: string,
  language: string,
  translations: PhraseTranslations,
): Promise<void> {
  try {
    await replaceBoardTranslations(boardSetId, boardId, language, translations);
  } catch {
    // Failure only costs a re-translation next load.
  }
}
