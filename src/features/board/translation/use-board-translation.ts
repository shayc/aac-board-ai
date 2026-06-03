import { useLanguage } from "@shared/language/use-language";
import { createTranslator } from "@shayc/react-built-in-ai";
import { useEffect, useState } from "react";
import { updateBoardStrings } from "../storage/db";
import type { Board } from "../types";
import {
  applyTranslations,
  collectTranslatableStrings,
  getBoardLanguage,
  resolveSyncTranslation,
} from "./board-translation-core";

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

        const translatableStrings = collectTranslatableStrings(board);
        const translations = await translatePhrases(
          translatableStrings,
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
  }, [setId, board, language]);

  return { translatedBoard };
}

async function translatePhrases(
  translatableStrings: Set<string>,
  translator: Translator,
  signal: AbortSignal,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Array.from(translatableStrings).map(async (phrase) => {
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
    await updateBoardStrings(setId, boardId, locale, translations);
  } catch {
    // Failure only costs a re-translation next load.
  }
}
