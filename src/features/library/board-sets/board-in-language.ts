import { getLanguageCode } from "@shared/language/locale";
import type {
  Board,
  StoredBoard,
  StringTranslations,
  TranslationsByLocale,
} from "../board-types";
import { nonBlankText } from "../non-blank-text";
import type { BoardSetRecord } from "../storage/board-set-storage";

const DEFAULT_SOURCE_LANGUAGE = "en";

export function resolveBoardInLanguage(
  storedBoard: StoredBoard,
  language: string,
): Board {
  const { locale, translationsByLocale, ...board } = storedBoard;
  if (getSourceLanguage(storedBoard) === language) {
    return { ...board, language };
  }

  const translations = findStringTranslations(translationsByLocale, language);
  if (translations) {
    return { ...applyTranslations(board, translations), language };
  }

  // The requested locale could give untranslated text the wrong voice.
  return { ...board, language: locale ? getLanguageCode(locale) : undefined };
}

export function getSourceLanguage({ locale }: { locale?: string }): string {
  return locale ? getLanguageCode(locale) : DEFAULT_SOURCE_LANGUAGE;
}

export function boardSetInLanguage(
  boardSet: BoardSetRecord,
  language: string,
): BoardSetRecord {
  return { ...boardSet, name: nameInLanguage(boardSet, language) };
}

export function nameInLanguage(
  {
    name,
    translatedNames,
  }: { name: string; translatedNames?: Readonly<Record<string, string>> },
  language: string,
): string {
  return translatedNames?.[language] || name;
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

export function applyTranslations<
  Translatable extends Pick<Board, "name" | "buttons">,
>(board: Translatable, translations: StringTranslations): Translatable {
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
