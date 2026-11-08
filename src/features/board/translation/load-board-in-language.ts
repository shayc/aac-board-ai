import { createTranslator } from "@shayc/react-built-in-ai";
import type { Board } from "../board-types";
import { replaceStringTranslations } from "../storage/board-content-storage";
import { loadStoredBoard } from "../storage/load-stored-board";
import {
  applyTranslations,
  collectBoardStrings,
  findBoardInLanguage,
  getBoardLanguage,
} from "./board-translations";

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

  const translations = await translateBoardStrings(board, language, signal);
  if (!translations) {
    return board;
  }

  void cacheTranslations(boardSetId, boardId, language, translations);

  return applyTranslations(board, translations);
}

async function translateBoardStrings(
  board: Board,
  language: string,
  signal?: AbortSignal,
): Promise<Record<string, string> | undefined> {
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
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Array.from(strings, async (text) => {
      const translated = await translator.translate(text, { signal });

      return [text, translated] as const;
    }),
  );

  return Object.fromEntries(entries);
}

async function cacheTranslations(
  boardSetId: string,
  boardId: string,
  language: string,
  translations: Record<string, string>,
): Promise<void> {
  try {
    await replaceStringTranslations(
      boardSetId,
      boardId,
      language,
      translations,
    );
  } catch {
    // Failure only costs a re-translation next load.
  }
}
