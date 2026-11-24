import { getLanguageCode } from "@shared/language/locale";
import type {
  Board,
  StringTranslations,
  TranslationsByLocale,
} from "../board-types";
import { nonBlankText } from "../non-blank-text";
import type { BoardSetRecord } from "../storage/board-set-storage";

const DEFAULT_SOURCE_LANGUAGE = "en";

interface BoardInLanguage {
  board: Board;
  boardLanguage: string | undefined;
}

export function resolveBoardInLanguage(
  board: Board,
  language: string,
): BoardInLanguage {
  if (getSourceLanguage(board) === language) {
    return { board, boardLanguage: language };
  }

  const translations = findStringTranslations(
    board.translationsByLocale,
    language,
  );
  if (translations) {
    return {
      board: applyTranslations(board, translations),
      boardLanguage: language,
    };
  }

  return {
    board,
    boardLanguage: board.locale ? getLanguageCode(board.locale) : undefined,
  };
}

export function getSourceLanguage({ locale }: { locale?: string }): string {
  return locale ? getLanguageCode(locale) : DEFAULT_SOURCE_LANGUAGE;
}

export function boardSetInLanguage(
  boardSet: BoardSetRecord,
  language: string,
): BoardSetRecord {
  const name = boardSet.translatedNames?.[language];

  return name ? { ...boardSet, name } : boardSet;
}

export function findStringTranslations(
  translationsByLocale: TranslationsByLocale,
  language: string,
): StringTranslations | undefined {
  for (const [locale, translations] of translationsByLocale) {
    if (getLanguageCode(locale) === language) {
      return translations;
    }
  }

  return undefined;
}

export function applyTranslations(
  board: Board,
  translations: StringTranslations,
): Board {
  function translateString(text: string | undefined) {
    const translated = text ? (translations.get(text) ?? text) : text;

    return nonBlankText(translated);
  }

  return {
    ...board,
    name: translateString(board.name) ?? "",
    buttons: board.buttons.map((button) => ({
      ...button,
      label: translateString(button.label) ?? "",
      vocalization: translateString(button.vocalization),
    })),
  };
}
