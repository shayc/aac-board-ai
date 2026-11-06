import { getLanguageCode } from "@shared/language/locale";
import type {
  Board,
  StringTranslations,
  TranslationsByLocale,
} from "../board-types";
import { nonBlankText } from "../non-blank-text";

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

export function getBoardLanguage(board: Board): string {
  return board.locale ? getLanguageCode(board.locale) : DEFAULT_BOARD_LANGUAGE;
}

export function findStringTranslations(
  translationsByLocale: TranslationsByLocale,
  language: string,
): StringTranslations | undefined {
  const match = Object.entries(translationsByLocale).find(
    ([locale]) => getLanguageCode(locale) === language,
  );

  return match?.[1];
}

export function applyTranslations(
  board: Board,
  translations: StringTranslations,
): Board {
  function translateString(text: string | undefined) {
    const translated = text ? (translations[text] ?? text) : text;

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
