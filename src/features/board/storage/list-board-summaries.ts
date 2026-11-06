import type { TranslationsByLocale } from "../board-types";
import { obfToTranslationsByLocale } from "../obf/obf-to-board";
import { listBoardRecords } from "./board-content-storage";

export interface BoardSummary {
  id: string;
  name: string;
  translationsByLocale: TranslationsByLocale;
}

export async function listBoardSummaries(
  boardSetId: string,
): Promise<BoardSummary[]> {
  const records = await listBoardRecords(boardSetId);

  return records.map(({ id, name, obf }) => ({
    id,
    name,
    translationsByLocale: obfToTranslationsByLocale(obf.strings),
  }));
}
