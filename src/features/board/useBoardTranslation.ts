import { useTranslator } from "@shared/ai/useTranslator";
import { getPrimaryLanguage } from "@shared/language/locale";
import { useLanguage } from "@shared/language/useLanguage";
import { useEffect, useState } from "react";
import { updateBoardStrings, withBoardsDB } from "./storage/boards-db";
import type { Board, BoardButton } from "./types";

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

      const existingStrings = findStringsForLanguage(board.strings, language);

      if (existingStrings) {
        setTranslatedBoard(applyStrings(board, existingStrings));
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

      const keys = collectTranslatableStrings(board);
      const translatedStrings = await translateStrings(keys, translator);

      if (cancelled) {
        return;
      }

      void persistStrings(setId, board.id, language, translatedStrings);

      setTranslatedBoard(applyStrings(board, translatedStrings));
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

function findStringsForLanguage(
  strings: Board["strings"],
  language: string,
): Record<string, string> | undefined {
  if (!strings) {
    return undefined;
  }

  if (strings[language]) {
    return strings[language];
  }

  for (const [key, value] of Object.entries(strings)) {
    if (getPrimaryLanguage(key) === language) {
      return value;
    }
  }

  return undefined;
}

function collectTranslatableStrings(board: Board): Set<string> {
  const keys = new Set<string>();

  if (board.name) {
    keys.add(board.name);
  }

  for (const button of board.buttons) {
    if (button.label) {
      keys.add(button.label);
    }
    if (button.vocalization) {
      keys.add(button.vocalization);
    }
  }

  return keys;
}

async function translateStrings(
  keys: Set<string>,
  translator: Translator,
): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Array.from(keys).map(async (key) => {
      const translated = await translator.translate(key);
      return [key, translated] as const;
    }),
  );

  return Object.fromEntries(entries);
}

function applyStrings(board: Board, strings: Record<string, string>): Board {
  const resolvedButtons: BoardButton[] = board.buttons.map((button) => ({
    ...button,
    label: button.label
      ? (strings[button.label] ?? button.label)
      : button.label,
    vocalization: button.vocalization
      ? (strings[button.vocalization] ?? button.vocalization)
      : button.vocalization,
  }));

  return {
    ...board,
    name: board.name ? (strings[board.name] ?? board.name) : board.name,
    buttons: resolvedButtons,
  };
}

async function persistStrings(
  setId: string,
  boardId: string,
  language: string,
  strings: Record<string, string>,
): Promise<void> {
  try {
    await withBoardsDB(async (db) => {
      await updateBoardStrings(db, setId, boardId, language, strings);
    });
  } catch (err) {
    console.warn("Failed to persist translated strings:", err);
  }
}
