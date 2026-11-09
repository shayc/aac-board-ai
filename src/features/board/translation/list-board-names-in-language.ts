import { obfToTranslationsByLocale } from "../obf/obf-to-board";
import { listBoardRecords } from "../storage/board-content-storage";
import { findStringTranslations, findTranslation } from "./board-translations";

export interface BoardName {
  id: string;
  name: string;
}

export async function listBoardNamesInLanguage(
  boardSetId: string,
  language: string,
): Promise<BoardName[]> {
  const records = await listBoardRecords(boardSetId);

  return records.map(({ id, name, obf }) => {
    const translations = findStringTranslations(
      obfToTranslationsByLocale(obf.strings),
      language,
    );

    return {
      id,
      name: (translations && findTranslation(translations, name)) ?? name,
    };
  });
}
