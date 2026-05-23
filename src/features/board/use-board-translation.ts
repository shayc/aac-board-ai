import { createTranslator } from "@shared/built-in-ai";
import { useLanguage } from "@shared/language/use-language";
import { getLanguageCode } from "@shared/utils/locale";
import { useEffect, useState } from "react";
import { updateBoardStrings, withBoardsDB } from "./storage/boards-db";
import type { Board } from "./types";

export interface UseBoardTranslationOptions {
  setId: string;
  board: Board;
}

export interface UseBoardTranslationReturn {
  translatedBoard: Board;
}

export function useBoardTranslation({
  setId,
  board,
}: UseBoardTranslationOptions): UseBoardTranslationReturn {
  const { language } = useLanguage();

  const [translatedBoard, setTranslatedBoard] = useState<Board>(
    () => resolveSyncTranslation(board, language) ?? board,
  );

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      const cached = resolveSyncTranslation(board, language);
      if (cached) {
        setTranslatedBoard(cached);
        return;
      }

      try {
        await using translator = await createTranslator({
          sourceLanguage: getBoardLanguage(board),
          targetLanguage: language,
          signal,
        });

        const phrases = collectSourcePhrases(board);
        const translations = await translatePhrases(
          phrases,
          translator,
          signal,
        );

        if (signal.aborted) {
          return;
        }

        void persistTranslations(setId, board.id, language, translations);
        setTranslatedBoard(applyTranslations(board, translations));
      } catch {
        // AAC UX: never flash source language on failure.
      }
    };

    void run();

    return () => controller.abort();
  }, [language, board, setId]);

  return { translatedBoard };
}

function resolveSyncTranslation(board: Board, language: string): Board | null {
  if (getBoardLanguage(board) === language) {
    return board;
  }
  const cached = findTranslations(board.strings, language);
  return cached ? applyTranslations(board, cached) : null;
}

function getBoardLanguage(board: Board): string {
  return board.locale ? getLanguageCode(board.locale) : "en";
}

function findTranslations(
  strings: Board["strings"],
  language: string,
): Record<string, string> | undefined {
  if (!strings) {
    return;
  }

  const match = Object.entries(strings).find(
    ([locale]) => getLanguageCode(locale) === language,
  );
  return match?.[1];
}

function applyTranslations(
  board: Board,
  translations: Record<string, string>,
): Board {
  const lookup = (phrase: string | undefined) =>
    phrase ? (translations[phrase] ?? phrase) : phrase;

  return {
    ...board,
    name: lookup(board.name),
    buttons: board.buttons.map((button) => ({
      ...button,
      label: lookup(button.label),
      vocalization: lookup(button.vocalization),
    })),
  };
}

function collectSourcePhrases(board: Board): Set<string> {
  const phrases = new Set<string>();

  if (board.name) {
    phrases.add(board.name);
  }

  for (const button of board.buttons) {
    if (button.label) {
      phrases.add(button.label);
    }
    if (button.vocalization) {
      phrases.add(button.vocalization);
    }
  }

  return phrases;
}

async function translatePhrases(
  phrases: Set<string>,
  translator: Translator,
  signal: AbortSignal,
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
  locale: string,
  translations: Record<string, string>,
): Promise<void> {
  try {
    await withBoardsDB(async (db) => {
      await updateBoardStrings(db, setId, boardId, locale, translations);
    });
  } catch {
    // Failure only costs a re-translation next load.
  }
}
