import { useTranslator } from "@shared/ai/useTranslator";
import { getPrimaryLanguage } from "@shared/language/locale";
import { useLanguage } from "@shared/language/useLanguage";
import { useEffect, useState } from "react";
import { updateBoardStrings, withBoardsDB } from "./storage/boards-db";
import type { Board } from "./types";

export interface UseBoardTranslationOptions {
  setId: string;
  board: Board | null;
}

export interface UseBoardTranslationReturn {
  translatedBoard: Board | null;
}

export function useBoardTranslation({
  setId,
  board,
}: UseBoardTranslationOptions): UseBoardTranslationReturn {
  const { language } = useLanguage();
  const { createTranslator } = useTranslator();

  const [translatedBoard, setTranslatedBoard] = useState<Board | null>(null);

  useEffect(() => {
    let cancelled = false;

    const translateBoard = async () => {
      if (!board) {
        return;
      }

      const boardLanguage = getPrimaryLanguage(board.locale ?? "en");

      if (boardLanguage === language) {
        setTranslatedBoard(board);
        return;
      }

      const existingTranslations = findTranslationsForLanguage(
        board.strings,
        language,
      );

      if (existingTranslations) {
        setTranslatedBoard(applyTranslations(board, existingTranslations));
        return;
      }

      const translator = await createTranslator({
        sourceLanguage: boardLanguage,
        targetLanguage: language,
      });

      if (cancelled) {
        return;
      }

      if (!translator) {
        setTranslatedBoard(board);
        return;
      }

      const phrases = collectSourcePhrases(board);
      const translations = await translatePhrases(phrases, translator);

      if (cancelled) {
        return;
      }

      void persistTranslations(setId, board.id, language, translations);

      setTranslatedBoard(applyTranslations(board, translations));
    };

    void translateBoard();

    return () => {
      cancelled = true;
    };
  }, [createTranslator, language, board, setId]);

  return {
    translatedBoard,
  };
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
    if (getPrimaryLanguage(locale) === language) {
      return translations;
    }
  }

  return undefined;
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
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Array.from(phrases).map(async (phrase) => {
      const translated = await translator.translate(phrase);
      return [phrase, translated] as const;
    }),
  );

  return Object.fromEntries(entries);
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

async function persistTranslations(
  setId: string,
  boardId: string,
  language: string,
  translations: Record<string, string>,
): Promise<void> {
  try {
    await withBoardsDB(async (db) => {
      await updateBoardStrings(db, setId, boardId, language, translations);
    });
  } catch (err) {
    console.warn("Failed to persist translations:", err);
  }
}
