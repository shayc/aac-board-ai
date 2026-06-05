import { useLanguage } from "@shared/language/use-language";
import { createTranslator } from "@shayc/react-built-in-ai";
import { useEffect, useState } from "react";
import { updateBoardStrings } from "../storage/db";
import type { Board } from "../types";
import {
  applyTranslations,
  collectTranslatableStrings,
  getBoardLanguage,
  findTranslatedBoard,
} from "./board-translation";

export interface UseBoardTranslationOptions {
  setId: string;
  board: Board;
}

export interface UseBoardTranslationReturn {
  translatedBoard: Board;
}

interface AsyncTranslation {
  board: Board;
  language: string;
  result: Board;
}

export function useBoardTranslation({
  setId,
  board,
}: UseBoardTranslationOptions): UseBoardTranslationReturn {
  const { language } = useLanguage();
  const [asyncTranslation, setAsyncTranslation] =
    useState<AsyncTranslation | null>(null);

  const found = findTranslatedBoard(board, language);
  const asyncResult =
    asyncTranslation?.board === board && asyncTranslation.language === language
      ? asyncTranslation.result
      : undefined;
  const translatedBoard = found ?? asyncResult ?? board;

  useEffect(() => {
    if (findTranslatedBoard(board, language)) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
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
        setAsyncTranslation({
          board,
          language,
          result: applyTranslations(board, translations),
        });
      } catch {
        // Translation unavailable — fall through to the source board.
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
  language: string,
  translations: Record<string, string>,
): Promise<void> {
  try {
    await updateBoardStrings(setId, boardId, language, translations);
  } catch {
    // Failure only costs a re-translation next load.
  }
}
