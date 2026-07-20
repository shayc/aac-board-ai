import { createTranslator } from "@shayc/react-built-in-ai";
import { updateBoardStrings } from "../storage/boards-db";
import type { Board } from "../types";
import {
  applyTranslations,
  collectTranslatablePhrases,
  findTranslatedBoard,
  getBoardLanguage,
} from "./board-strings";

export async function resolveTranslatedBoard(
  setId: string,
  board: Board,
  language: string,
  signal?: AbortSignal,
): Promise<Board> {
  const existing = findTranslatedBoard(board, language);
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

      void persistTranslations(setId, board.id, language, translations);

      return applyTranslations(board, translations);
    } finally {
      translator.destroy();
    }
  } catch {
    // Total by design: translation is an enhancement, not a requirement —
    // symbols carry the meaning, so a failure must never block the board.
    return board;
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
