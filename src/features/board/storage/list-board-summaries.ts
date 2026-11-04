import type { BoardTranslations } from "../board-types";
import { nonBlankText } from "../non-blank-text";
import { obfToBoardTranslations } from "../obf/obf-to-board";
import { listBoardRecords } from "./board-content-storage";

export interface BoardSummary {
  id: string;
  name: string;
  translations: BoardTranslations;
}

export async function listBoardSummaries(
  boardSetId: string,
): Promise<BoardSummary[]> {
  const records = await listBoardRecords(boardSetId);

  return records.map(({ id, name, obf }) => ({
    id,
    name: nonBlankText(name) ?? id,
    translations: obfToBoardTranslations(obf.strings),
  }));
}
