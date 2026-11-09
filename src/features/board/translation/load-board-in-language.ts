import { createTranslator } from "@shayc/react-built-in-ai";
import type { Board, BoardKey, StringTranslations } from "../board-types";
import { replaceStringTranslations } from "../storage/board-content-storage";
import { loadStoredBoard } from "../storage/load-stored-board";
import {
  applyTranslations,
  collectBoardStrings,
  findBoardInLanguage,
  getBoardLanguage,
} from "./board-translations";

export async function loadBoardInLanguage(
  key: BoardKey,
  language: string,
  signal?: AbortSignal,
): Promise<Board> {
  const board = await loadStoredBoard(key, signal);

  const existing = findBoardInLanguage(board, language);
  if (existing) {
    return existing;
  }

  const translations = await translateBoardStrings(board, language, signal);
  if (!translations) {
    return board;
  }

  void cacheTranslations(key, language, translations);

  return applyTranslations(board, translations);
}

async function translateBoardStrings(
  board: Board,
  language: string,
  signal?: AbortSignal,
): Promise<StringTranslations | undefined> {
  const strings = collectBoardStrings(board);
  if (strings.size === 0) {
    return undefined;
  }

  try {
    const translator = await createTranslator({
      sourceLanguage: getBoardLanguage(board),
      targetLanguage: language,
      signal,
    });

    try {
      return await translateStrings(strings, translator, signal);
    } finally {
      translator.destroy();
    }
  } catch {
    signal?.throwIfAborted();

    // Translation is optional; failures must leave the source board usable.
    return undefined;
  }
}

async function translateStrings(
  strings: Set<string>,
  translator: Translator,
  signal?: AbortSignal,
): Promise<StringTranslations> {
  const entries = await Promise.all(
    Array.from(strings, async (text) => {
      const translated = await translator.translate(text, { signal });

      return [text, translated] as const;
    }),
  );

  return new Map(entries);
}

async function cacheTranslations(
  key: BoardKey,
  language: string,
  translations: StringTranslations,
): Promise<void> {
  try {
    await replaceStringTranslations(key, language, translations);
  } catch {
    // Failure only costs a re-translation next load.
  }
}
