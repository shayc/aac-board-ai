import { BuiltInAIError, createTranslator } from "@shared/built-in-ai";
import { useLanguage } from "@shared/language/use-language";
import { getLanguageCode } from "@shared/utils/locale";
import { useEffect, useRef, useState } from "react";
import { updateBoardStrings, withBoardsDB } from "./storage/boards-db";
import type { Board } from "./types";

export interface UseBoardTranslationOptions {
  setId: string;
  board: Board;
}

export interface UseBoardTranslationReturn {
  /**
   * Best-known translation of the current board for the active language.
   * May lag the `board`/`language` inputs by one frame during transitions:
   * the previous board stays visible while the next translation resolves,
   * per the AAC UX rule against flashing source language.
   */
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
  const hasRunEffect = useRef(false);

  useEffect(() => {
    const isFirstRun = !hasRunEffect.current;
    hasRunEffect.current = true;

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
      const sync = resolveSyncTranslation(board, language);
      if (sync) {
        // First run already has the sync result as initial state; skip the
        // redundant setState that would otherwise force a second mount render.
        if (!isFirstRun) {
          setTranslatedBoard(sync);
        }
        return;
      }

      // No cached translation. Leave current state visible while we
      // translate — per AAC UX rule, transitions keep the old board
      // rather than flashing source.

      // Imperative createTranslator (vs. useTranslator) because we only
      // know the language pair after the sync-translation check above.
      try {
        await using translator = await createTranslator({
          sourceLanguage: getBoardLanguage(board),
          targetLanguage: language,
          signal,
        });
        if (signal.aborted) {
          return;
        }

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
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (error instanceof BuiltInAIError) {
          setTranslatedBoard(board);
          return;
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [language, board, setId]);

  return {
    translatedBoard,
  };
}

function getBoardLanguage(board: Board): string {
  return board.locale ? getLanguageCode(board.locale) : "en";
}

function findTranslationsForLanguage(
  strings: Board["strings"],
  language: string,
): Record<string, string> | undefined {
  if (!strings) {
    return undefined;
  }

  if (strings[language]) {
    return strings[language];
  }

  for (const [locale, translations] of Object.entries(strings)) {
    if (getLanguageCode(locale) === language) {
      return translations;
    }
  }

  return undefined;
}

function applyTranslations(
  board: Board,
  translations: Record<string, string>,
): Board {
  const translate = (phrase: string | undefined) =>
    phrase ? (translations[phrase] ?? phrase) : phrase;

  return {
    ...board,
    name: translate(board.name),
    buttons: board.buttons.map((button) => ({
      ...button,
      label: translate(button.label),
      vocalization: translate(button.vocalization),
    })),
  };
}

function resolveSyncTranslation(board: Board, language: string): Board | null {
  if (getBoardLanguage(board) === language) {
    return board;
  }
  const cached = findTranslationsForLanguage(board.strings, language);
  return cached ? applyTranslations(board, cached) : null;
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
    // Best-effort cache write — failure only costs a re-translation next load.
  }
}
