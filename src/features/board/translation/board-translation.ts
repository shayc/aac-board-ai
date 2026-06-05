import { getLanguageCode } from "@shared/utils/locale";
import type { Board } from "../types";

const DEFAULT_BOARD_LANGUAGE = "en";

export function findTranslatedBoard(
  board: Board,
  language: string,
): Board | undefined {
  if (getBoardLanguage(board) === language) {
    return board;
  }

  const cached = findTranslations(board.strings, language);

  return cached ? applyTranslations(board, cached) : undefined;
}

export function hasTranslatedBoard(board: Board, language: string): boolean {
  return (
    getBoardLanguage(board) === language ||
    Boolean(findTranslations(board.strings, language))
  );
}

export function getBoardLanguage(board: Board): string {
  return board.locale ? getLanguageCode(board.locale) : DEFAULT_BOARD_LANGUAGE;
}

export function findTranslations(
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

export function applyTranslations(
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

export function collectTranslatableStrings(board: Board): Set<string> {
  const translatableStrings = new Set<string>();

  if (board.name) {
    translatableStrings.add(board.name);
  }

  for (const button of board.buttons) {
    if (button.label) {
      translatableStrings.add(button.label);
    }

    if (button.vocalization) {
      translatableStrings.add(button.vocalization);
    }
  }

  return translatableStrings;
}
