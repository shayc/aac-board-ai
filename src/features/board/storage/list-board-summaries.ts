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
    translatedNames: translateName(
      name,
      obfToTranslationsByLocale(obf.strings),
    ),
  }));
}

function translateName(
  name: string,
  translationsByLocale: TranslationsByLocale,
): Record<string, string> {
  const translatedNames: Record<string, string> = {};

  for (const [locale, translations] of translationsByLocale) {
    const language = getLanguageCode(locale);
    const translatedName = translations.get(name);

    // The first locale of a language wins, as when a board is shown in it.
    if (translatedName !== undefined && !(language in translatedNames)) {
      translatedNames[language] = translatedName;
    }
  }

  return translatedNames;
}
