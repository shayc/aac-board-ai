import type { BoardName } from "../board-types";
import { obfToTranslationsByLocale } from "../obf/obf-to-board";
import { listBoardRecords } from "../storage/board-content-storage";
import { findTextInLanguage } from "./board-translations";

export async function listBoardNamesInLanguage(
  boardSetId: string,
  language: string,
): Promise<BoardName[]> {
  const records = await listBoardRecords(boardSetId);

  return records.map(({ id, name, obf }) => ({
    id,
    name:
      findTextInLanguage(
        obfToTranslationsByLocale(obf.strings),
        language,
        name,
      ) ?? name,
  }));
}
