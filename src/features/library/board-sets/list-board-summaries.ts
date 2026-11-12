import { getLanguageCode } from "@shared/language/locale";
import type { TranslationsByLocale } from "../board-types";
import { obfToTranslationsByLocale } from "../obf/obf-to-board";
import { listBoardRecords } from "../storage/board-content-storage";
import { findStringTranslations } from "../translation/board-translations";

export interface BoardSummary {
  id: string;
  name: string;
  translatedNames: Readonly<Record<string, string>>;
}

export async function listBoardSummaries(
  boardSetId: string,
): Promise<BoardSummary[]> {
  const records = await listBoardRecords(boardSetId);

  return records.map(({ id, name, obf }) => ({
    id,
    name,
    translatedNames: findTranslatedNames(
      name,
      obfToTranslationsByLocale(obf.strings),
    ),
  }));
}

function findTranslatedNames(
  name: string,
  translationsByLocale: TranslationsByLocale,
): Record<string, string> {
  const translatedNames: Record<string, string> = {};

  for (const locale of translationsByLocale.keys()) {
    const language = getLanguageCode(locale);
    const translatedName = findStringTranslations(
      translationsByLocale,
      language,
    )?.get(name);
    if (translatedName !== undefined) {
      translatedNames[language] = translatedName;
    }
  }

  return translatedNames;
}
