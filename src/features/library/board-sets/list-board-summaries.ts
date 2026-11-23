import { getLanguageCode } from "@shared/language/locale";
import type { TranslationsByLocale } from "../board-types";
import { nonBlankText } from "../non-blank-text";
import { obfToTranslationsByLocale } from "../obf/obf-strings";
import { listBoardRecords } from "../storage/board-content-storage";
import { findStringTranslations } from "./board-in-language";

export interface BoardSummary {
  id: string;
  name: string;
  translatedNames: Readonly<Record<string, string>>;
}

export async function listBoardSummaries(
  boardSetId: string,
): Promise<BoardSummary[]> {
  const records = await listBoardRecords(boardSetId);

  return records.map(({ id, obf }) => {
    const name = nonBlankText(obf.name) ?? id;

    return {
      id,
      name,
      translatedNames: findTranslatedNames(
        name,
        obfToTranslationsByLocale(obf.strings),
      ),
    };
  });
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
