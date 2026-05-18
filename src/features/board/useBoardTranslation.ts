import { createSession } from "@shared/ai/built-in-ai/namespaces";
import { setDownloadProgress } from "@shared/ai/downloadProgress";
import {
  getPrimaryLanguage,
  normalizeLocaleCode,
} from "@shared/language/locale";
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

  const [translatedBoard, setTranslatedBoard] = useState<Board | null>(null);

  useEffect(() => {
    if (!board) return;

    const controller = new AbortController();
    const { signal } = controller;

    const run = async () => {
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

      const sourceLanguage = normalizeLocaleCode(boardLanguage);
      const targetLanguage = normalizeLocaleCode(language);
      const progressKey = `${sourceLanguage}:${targetLanguage}`;

      // Imperative createSession (vs. useTranslator) because we only know the
      // language pair after checking for a cached translation above.
      let translator: Translator | null = null;
      try {
        translator = await createSession("Translator", {
          sourceLanguage,
          targetLanguage,
          signal,
          onProgress: (progress) =>
            setDownloadProgress("Translator", progress, progressKey),
        });
        if (signal.aborted) return;
        if (!translator) {
          setTranslatedBoard(board);
          return;
        }

        const phrases = collectSourcePhrases(board);
        const translations = await translatePhrases(
          phrases,
          translator,
          signal,
        );
        if (signal.aborted) return;

        void persistTranslations(setId, board.id, language, translations);
        setTranslatedBoard(applyTranslations(board, translations));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        console.warn("Board translation failed:", error);
      } finally {
        translator?.destroy();
        // Clear in-flight progress so an aborted download (e.g. language
        // switched mid-download) doesn't leave a stale entry that keeps
        // `useDownloadProgress("Translator")` reporting > 0 forever.
        setDownloadProgress("Translator", 1, progressKey);
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
