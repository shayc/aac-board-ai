import { getLanguageCode } from "@shared/language/locale";
import type { Board } from "../board-types";
import { normalizeButtonText } from "../normalize-button-text";

const DEFAULT_BOARD_LANGUAGE = "en";

export function findTranslatedBoard(
  board: Board,
  language: string,
): Board | undefined {
  if (getBoardLanguage(board) === language) {
    return board;
  }

  const cached = findTranslations(board.translations, language);

  return cached ? applyTranslations(board, cached) : undefined;
}

export function getBoardLanguage(board: Board): string {
  return board.locale ? getLanguageCode(board.locale) : DEFAULT_BOARD_LANGUAGE;
}

export function findTranslations(
  translations: Board["translations"],
  language: string,
): Record<string, string> | undefined {
  if (!translations) {
    return;
  }

  const match = Object.entries(translations).find(
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
      label: normalizeButtonText(lookup(button.label)),
      vocalization: normalizeButtonText(lookup(button.vocalization)),
    })),
  };
}

export function collectTranslatablePhrases(board: Board): Set<string> {
  const translatablePhrases = new Set<string>();

  if (board.name) {
    translatablePhrases.add(board.name);
  }

  for (const button of board.buttons) {
    if (button.label) {
      translatablePhrases.add(button.label);
    }

    if (button.vocalization) {
      translatablePhrases.add(button.vocalization);
    }
  }

  return translatablePhrases;
}
