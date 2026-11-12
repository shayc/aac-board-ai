import { getLanguageCode } from "@shared/language/locale";
import type { TranslationsByLocale } from "@shared/board/board-types";
import { obfToTranslationsByLocale } from "../obf/obf-to-board";
import { findStringTranslations } from "../translations/board-translations";
import { listBoardRecords } from "./board-content-storage";

export interface BoardSummary {
  id: string;
  name: string;
  namesByLanguage: Readonly<Record<string, string>>;
}

export async function listBoardSummaries(
  boardSetId: string,
): Promise<BoardSummary[]> {
  const records = await listBoardRecords(boardSetId);

  return records.map(({ id, name, obf }) => ({
    id,
    name,
    namesByLanguage: findNamesByLanguage(
      name,
      obfToTranslationsByLocale(obf.strings),
    ),
  }));
}

function findNamesByLanguage(
  name: string,
  translationsByLocale: TranslationsByLocale,
): Record<string, string> {
  const namesByLanguage: Record<string, string> = {};

  for (const locale of translationsByLocale.keys()) {
    const language = getLanguageCode(locale);
    const translatedName = findStringTranslations(
      translationsByLocale,
      language,
    )?.get(name);

    if (translatedName !== undefined) {
      namesByLanguage[language] = translatedName;
    }
  }

  return namesByLanguage;
}
