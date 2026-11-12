import type {
  StringTranslations,
  TranslationsByLocale,
} from "@shared/board/board-types";
import { getLanguageCode } from "@shared/language/locale";

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
