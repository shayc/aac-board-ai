import { getLanguageCode } from "@shared/language/locale";
import type {
  Board,
  StringTranslations,
  TranslationsByLocale,
} from "../board-types";
import { nonBlankText } from "../non-blank-text";
import type { BoardSetRecord } from "../storage/board-set-storage";

const DEFAULT_BOARD_LANGUAGE = "en";

export function findBoardInLanguage(
  board: Board,
  language: string,
): Board | undefined {
  if (getBoardLanguage(board) === language) {
    return board;
  }

  const translations = findStringTranslations(
    board.translationsByLocale,
    language,
  );

  return translations ? applyTranslations(board, translations) : undefined;
}

export function getBoardLanguage({ locale }: { locale?: string }): string {
  return locale ? getLanguageCode(locale) : DEFAULT_BOARD_LANGUAGE;
}

interface TranslatedName {
  readonly name: string;
  readonly translatedNames?: Readonly<Record<string, string>>;
}

export function nameInLanguage(
  { name, translatedNames }: TranslatedName,
  language: string,
): string {
  return translatedNames?.[language] || name;
}

export function boardSetInLanguage(
  boardSet: BoardSetRecord,
  language: string,
): BoardSetRecord {
  return { ...boardSet, name: nameInLanguage(boardSet, language) };
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

export function collectBoardStrings(board: Board): Set<string> {
  const strings = new Set<string>();

  if (board.name) {
    strings.add(board.name);
  }

  for (const button of board.buttons) {
    if (button.label) {
      strings.add(button.label);
    }

    if (button.vocalization) {
      strings.add(button.vocalization);
    }
  }

  return strings;
}
