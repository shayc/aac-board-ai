import { getLanguageCode } from "@shared/language/locale";
import type { TranslationsByLocale } from "../board-types";
import { obfToTranslationsByLocale } from "../obf/obf-to-board";
import { listBoardRecords } from "./board-content-storage";

export interface BoardSummary {
  id: string;
  name: string;
  /** Language code → board name, like a board set's `translatedNames`. */
  translatedNames: Readonly<Record<string, string>>;
}

export async function listBoardSummaries(
  boardSetId: string,
): Promise<BoardSummary[]> {
  const records = await listBoardRecords(boardSetId);

  return records.map(({ id, name, obf }) => ({
    id,
    name,
    translatedNames: namesByLanguage(
      name,
      obfToTranslationsByLocale(obf.strings),
    ),
  }));
}

function namesByLanguage(
  name: string,
  translationsByLocale: TranslationsByLocale,
): Record<string, string> {
  const names: Record<string, string> = {};
  const seenLanguages = new Set<string>();

  for (const [locale, translations] of translationsByLocale) {
    const language = getLanguageCode(locale);

    // A board is shown in the first locale of a language, so its name comes
    // from that locale too, even when a later one could supply it.
    if (seenLanguages.has(language)) {
      continue;
    }

    seenLanguages.add(language);

    const translatedName = translations.get(name);
    if (translatedName !== undefined) {
      names[language] = translatedName;
    }
  }

  return names;
}
