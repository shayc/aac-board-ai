import { normalizeLocale } from "@shared/language/locale";
import type { OBFBoard } from "@shayc/open-board-format";
import type { StringTranslations, TranslationsByLocale } from "../board-types";

export function obfToTranslationsByLocale(
  strings: OBFBoard["strings"],
): TranslationsByLocale {
  if (!strings) {
    return new Map();
  }

  return new Map(
    Object.entries(strings).map(([locale, translations]) => [
      normalizeLocale(locale),
      new Map(Object.entries(translations)),
    ]),
  );
}

/** Adds one language's board strings, keeping the languages the board already has. */
export function withOBFStrings(
  obfBoard: OBFBoard,
  language: string,
  translations: StringTranslations,
): OBFBoard {
  return {
    ...obfBoard,
    strings: {
      ...obfBoard.strings,
      [language]: Object.fromEntries(translations),
    },
  };
}
