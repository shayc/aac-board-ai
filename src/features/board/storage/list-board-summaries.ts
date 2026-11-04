import type { BoardTranslations } from "../board-types";
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
    name,
    translations: obfToBoardTranslations(obf.strings),
  }));
}
